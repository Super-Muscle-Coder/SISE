import asyncio
import asyncpg


async def test():
    url = "postgresql+asyncpg://SISE_POSTGRES_ADMIN:Daucatmoi12345@sise-postgres:5432/sise"
    asyncpg_url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
    print("Connecting to:", asyncpg_url)
    try:
        conn = await asyncio.wait_for(asyncpg.connect(asyncpg_url), timeout=5.0)
        row = await conn.fetchrow("SELECT extname FROM pg_extension WHERE extname = 'vector'")
        print("Row result:", row)
        await conn.close()
        print("SUCCESS")
    except Exception as e:
        print("EXCEPTION TYPE:", type(e).__name__)
        print("EXCEPTION MSG:", str(e))


asyncio.run(test())
