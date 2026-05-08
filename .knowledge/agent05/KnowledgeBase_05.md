# =============================================================================
# KNOWLEDGE BASE — AG-05 MobileFrontendAgent
# =============================================================================
# Writer  : Project Owner + AG-00 + AG-05 (đề xuất, AG-00 approve)
# Reader  : AG-05 chủ yếu
# =============================================================================

## 1. DOMAIN KNOWLEDGE: EXPO MANAGED WORKFLOW

### 1.1 Project structure

```
modules/FrontendMobile/
├── app/                         # Expo Router file-based routing
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                  # Bottom tab navigation
│   │   ├── index.tsx            # Search screen (default tab)
│   │   ├── albums.tsx
│   │   └── profile.tsx
│   └── _layout.tsx
├── src/
│   ├── api/                     # API client tương tự AG-04
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── media.ts
│   │   └── search.ts
│   ├── components/
│   │   ├── ui/                  # Button, Input, Card (React Native components)
│   │   ├── media/               # ImageCard, ImageGrid
│   │   └── search/              # CameraSearchButton, SearchResultList
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCameraSearch.ts
│   │   └── useOfflineCache.ts
│   ├── store/                   # Zustand hoặc React Context
│   │   ├── authStore.ts
│   │   └── cacheStore.ts
│   ├── types/                   # Đồng bộ với openapi.yaml
│   │   ├── auth.ts
│   │   ├── media.ts
│   │   └── search.ts
│   └── utils/
│       ├── offlineCache.ts      # AsyncStorage wrapper
│       └── fileValidation.ts
├── app.json                     # Expo config
├── eas.json                     # EAS Build config
└── package.json
```

---

## 2. DOMAIN KNOWLEDGE: CAMERA INTEGRATION

### 2.1 Camera permissions & capture

```typescript
// src/hooks/useCameraSearch.ts
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

const useCameraSearch = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const captureAndSearch = async () => {
    if (!hasPermission) {
      Alert.alert("Camera permission denied");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,  // Compress để giảm upload time
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await searchByImageUri(uri);
    }
  };

  return { captureAndSearch, hasPermission };
};
```

### 2.2 Image picker từ thư viện

```typescript
const pickImageFromGallery = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: false,
    quality: 0.8,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;
    await searchByImageUri(uri);
  }
};
```

---

## 3. DOMAIN KNOWLEDGE: OFFLINE CACHE

### 3.1 AsyncStorage pattern

```typescript
// src/utils/offlineCache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = 'search_cache_';

export const cacheSearchResult = async (
  queryImageUri: string,
  results: SearchResult[]
) => {
  const key = `${CACHE_KEY_PREFIX}${Date.now()}`;
  await AsyncStorage.setItem(key, JSON.stringify({ queryImageUri, results }));
};

export const getRecentSearches = async (): Promise<CachedSearch[]> => {
  const allKeys = await AsyncStorage.getAllKeys();
  const cacheKeys = allKeys.filter(k => k.startsWith(CACHE_KEY_PREFIX));

  // Lấy tối đa 10 tìm kiếm gần nhất
  const recentKeys = cacheKeys.slice(-10);
  const values = await AsyncStorage.multiGet(recentKeys);

  return values.map(([_, v]) => JSON.parse(v!));
};
```

### 3.2 Offline-first search UX

```typescript
const searchByImageUri = async (uri: string) => {
  setLoading(true);

  try {
    // Try API call first
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'query.jpg',
    } as any);

    const { data } = await apiClient.post('/search/image', formData);
    setResults(data.results);

    // Cache kết quả để xem offline sau
    await cacheSearchResult(uri, data.results);
  } catch (error) {
    // Nếu offline, hiển thị cache gần nhất
    Alert.alert("Offline", "Showing recent cached results");
    const cached = await getRecentSearches();
    if (cached.length > 0) setResults(cached[0].results);
  } finally {
    setLoading(false);
  }
};
```

---

## 4. DOMAIN KNOWLEDGE: SHARE EXTENSION

### 4.1 Receive shared images từ app khác

Trong `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-sharing",
        {
          "photosPermission": "Allow SISE to access photos for search"
        }
      ]
    ]
  }
}
```

Xử lý shared intent:
```typescript
import * as Sharing from 'expo-sharing';

// Khi app được launch từ share intent
useEffect(() => {
  const handleSharedImage = async () => {
    // Expo hiện tại chưa hỗ trợ receive share intent đầy đủ
    // Cần native module hoặc chờ update từ Expo SDK
    // Placeholder logic:
    const sharedUri = await getSharedImageUri();  // Custom native module
    if (sharedUri) {
      await searchByImageUri(sharedUri);
    }
  };
  handleSharedImage();
}, []);
```

> ⚠️ **Note**: Share extension đầy đủ có thể cần custom native code. Đánh dấu P2 trong Tasks.yaml.

---

## 5. DOMAIN KNOWLEDGE: EAS BUILD & DEPLOY

### 5.1 EAS configuration (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./secrets/google-service-account.json"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890"
      }
    }
  }
}
```

### 5.2 Build commands

```bash
# Development build (chạy trên device với Expo Go)
eas build --profile development --platform android

# Preview build (APK standalone)
eas build --profile preview --platform android

# Production build
eas build --profile production --platform all

# Submit to store
eas submit --platform android
```

---

## 6. DOMAIN KNOWLEDGE: PERFORMANCE OPTIMIZATION

### 6.1 Image loading optimization

```typescript
import { Image } from 'expo-image';  // Thay vì React Native Image

// Expo Image có built-in caching và lazy loading
<Image
  source={{ uri: result.presignedUrl }}
  placeholder={blurhash}           // Blur placeholder khi loading
  contentFit="cover"
  transition={200}
  style={{ width: 200, height: 200 }}
/>
```

### 6.2 FlatList optimization cho search results

```typescript
<FlatList
  data={results}
  keyExtractor={(item) => item.imageId}
  renderItem={({ item }) => <ImageCard result={item} />}
  initialNumToRender={10}           // Render 10 items đầu
  maxToRenderPerBatch={5}           // Batch size khi scroll
  windowSize={5}                     // Số "màn hình" để pre-render
  removeClippedSubviews={true}      // Unmount items xa viewport
/>
```

---

## 7. DOMAIN KNOWLEDGE: ENVIRONMENT VARIABLES

```typescript
// src/config/env.ts
export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.100:8000',
  // Dùng IP local machine khi develop với device thật
  // Production: https://api.yourdomain.com
};
```

Trong `.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

---

## 8. RANH GIỚI CỨNG

- AG-05 **không** gọi thẳng AI Service hay Storage.
- AG-05 **không** xử lý embedding hay vector logic.
- AG-05 **không** viết native code ngoại trừ khi Expo SDK không hỗ trợ (và phải được AG-00 approve trước).
- Tham chiếu `openapi.yaml` để biết endpoint và response schema.
- Mọi API call phải đi qua `src/api/` — không gọi trực tiếp trong components.
- Build APK/iOS qua EAS, **không** build local trừ khi debug native modules.
