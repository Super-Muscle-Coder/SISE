"""
generate_report.py
====================
Đọc dữ liệu ĐÃ LƯU SẴN từ lần chạy run_benchmark.py trước đó (KHÔNG gọi
lại AIModule, KHÔNG cần internet, KHÔNG cần chờ 30+ phút) — sinh ra biểu
đồ tương tác (Plotly) + báo cáo HTML hoàn chỉnh trong VÀI GIÂY.

MỤC ĐÍCH: dùng để trình bày/demo trực tiếp trước hội đồng — chạy script
này ngay tại chỗ để chứng minh quy trình phân tích là thật, có thể tái
tạo lại, không phải ảnh tĩnh chèn sẵn vào slide.

Yêu cầu: đã chạy run_benchmark.py ít nhất 1 lần trước đó (có sẵn
output/flickr30k_results.json, embeddings_cache.npz, raw_events.jsonl).

Cách chạy:
    pip install plotly pandas --break-system-packages
    python generate_report.py

Output:
    output/report.html          <- báo cáo hoàn chỉnh, mở bằng trình duyệt
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

OUTPUT_DIR = Path(__file__).parent / "output"
RESULTS_PATH = OUTPUT_DIR / "flickr30k_results.json"
RAW_EVENTS_PATH = OUTPUT_DIR / "raw_events.jsonl"
EMBEDDINGS_CACHE_PATH = OUTPUT_DIR / "embeddings_cache.npz"
DOCKER_STATS_PATH = OUTPUT_DIR / "docker_stats_log.jsonl"
REPORT_HTML_PATH = OUTPUT_DIR / "report.html"

# Dataset tự thân — file do measure_own_dataset_latency.py sinh ra
OWN_DATASET_LATENCY_PATH = OUTPUT_DIR / "own_dataset_latency.json"
OWN_DATASET_DOCKER_STATS_PATH = OUTPUT_DIR / "own_dataset_docker_stats.jsonl"


def load_all_data() -> dict[str, Any]:
    if not RESULTS_PATH.exists():
        raise FileNotFoundError(
            f"Không tìm thấy {RESULTS_PATH}. Cần chạy run_benchmark.py trước ít nhất 1 lần."
        )
    results = json.loads(RESULTS_PATH.read_text(encoding="utf-8"))

    raw_events = []
    if RAW_EVENTS_PATH.exists():
        with open(RAW_EVENTS_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    raw_events.append(json.loads(line))

    docker_stats = []
    if DOCKER_STATS_PATH.exists():
        with open(DOCKER_STATS_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    docker_stats.append(json.loads(line))

    own_dataset_latency = None
    if OWN_DATASET_LATENCY_PATH.exists():
        own_dataset_latency = json.loads(OWN_DATASET_LATENCY_PATH.read_text(encoding="utf-8"))

    own_dataset_docker_stats = []
    if OWN_DATASET_DOCKER_STATS_PATH.exists():
        with open(OWN_DATASET_DOCKER_STATS_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    own_dataset_docker_stats.append(json.loads(line))

    return {
        "results": results,
        "raw_events": raw_events,
        "docker_stats": docker_stats,
        "own_dataset_latency": own_dataset_latency,
        "own_dataset_docker_stats": own_dataset_docker_stats,
    }


def build_charts(data: dict[str, Any]) -> dict[str, str]:
    try:
        import plotly.graph_objects as go
        from plotly.subplots import make_subplots
    except ImportError as exc:
        raise RuntimeError(
            "Thiếu thư viện 'plotly'. Cài đặt bằng: pip install plotly pandas --break-system-packages"
        ) from exc

    results = data["results"]
    charts: dict[str, str] = {}

    top_k_default = results["run_info"]["top_k_default"]
    i2t_by_k = results["image_to_text"]["metrics_by_k"]
    t2i_by_k = results["text_to_image"]["metrics_by_k"]
    i2t = i2t_by_k.get(str(top_k_default)) or i2t_by_k.get(top_k_default) or list(i2t_by_k.values())[-1]
    t2i = t2i_by_k.get(str(top_k_default)) or t2i_by_k.get(top_k_default) or list(t2i_by_k.values())[-1]

    own = results.get("own_dataset_comparison", {})

    # ===== Biểu đồ 1: So sánh 4 chỉ số =====
    metric_names = ["mrr", "hit_rate", "precision", "recall"]
    fig1 = go.Figure()
    if own:
        fig1.add_trace(go.Bar(name="Dataset tự thân", x=metric_names, y=[own.get(m, 0) for m in metric_names]))
    fig1.add_trace(go.Bar(name="Flickr30K (Image→Text)", x=metric_names, y=[i2t.get(m, 0) for m in metric_names]))
    fig1.add_trace(go.Bar(name="Flickr30K (Text→Image)", x=metric_names, y=[t2i.get(m, 0) for m in metric_names]))
    fig1.update_layout(title="So sánh 4 chỉ số cốt lõi giữa các thực nghiệm", barmode="group", yaxis_title="Giá trị")
    charts["comparison_bar"] = fig1.to_html(full_html=False, include_plotlyjs="cdn")

    # ===== Biểu đồ 2: Phân phối rank =====
    fig2 = make_subplots(rows=1, cols=2, subplot_titles=("Image-to-Text", "Text-to-Image"))
    for col, direction in [(1, "image_to_text"), (2, "text_to_image")]:
        dist = results[direction]["rank_distribution"]
        labels = list(dist.keys())
        values = [dist[label]["percentage"] for label in labels]
        fig2.add_trace(go.Bar(x=labels, y=values, name=direction), row=1, col=col)
    fig2.update_layout(title="Phân phối vị trí (rank) của kết quả đúng đầu tiên", showlegend=False)
    charts["rank_distribution"] = fig2.to_html(full_html=False, include_plotlyjs=False)

    # ===== Biểu đồ 3: Latency percentiles — SO SÁNH CẢ 2 DATASET =====
    lat = results["latency"]
    own_lat = data.get("own_dataset_latency")

    fig3 = go.Figure()
    fig3.add_trace(go.Bar(
        name="Flickr30K — Embed ảnh", x=["P50", "P95", "P99", "Mean"],
        y=[lat["image_embed"]["p50"], lat["image_embed"]["p95"], lat["image_embed"]["p99"], lat["image_embed"]["mean"]],
    ))
    fig3.add_trace(go.Bar(
        name="Flickr30K — Embed văn bản", x=["P50", "P95", "P99", "Mean"],
        y=[lat["text_embed"]["p50"], lat["text_embed"]["p95"], lat["text_embed"]["p99"], lat["text_embed"]["mean"]],
    ))
    if own_lat:
        own_l = own_lat["latency"]
        fig3.add_trace(go.Bar(
            name="Dataset tự thân — Embed ảnh (qua MinIO)", x=["P50", "P95", "P99", "Mean"],
            y=[own_l["p50"], own_l["p95"], own_l["p99"], own_l["mean"]],
        ))
    fig3.update_layout(title="Phân vị Latency (mili-giây) — So sánh 2 Dataset", barmode="group", yaxis_title="ms")
    charts["latency"] = fig3.to_html(full_html=False, include_plotlyjs=False)

    # ===== Biểu đồ 4: Breakdown theo danh tính =====
    if own and "breakdown_by_class" in own:
        breakdown = own["breakdown_by_class"]
        classes = list(breakdown.keys())
        fig4 = go.Figure()
        fig4.add_trace(go.Bar(x=classes, y=[breakdown[c]["confusion_pct"] for c in classes], name="Tỷ lệ nhầm lẫn (%)", marker_color="crimson"))
        fig4.add_trace(go.Bar(x=classes, y=[breakdown[c]["precision"] * 100 for c in classes], name="Precision (x100)", marker_color="steelblue"))
        fig4.update_layout(title="Breakdown theo danh tính — Dataset tự thân", barmode="group", xaxis_tickangle=-45)
        charts["own_breakdown"] = fig4.to_html(full_html=False, include_plotlyjs=False)

    # ===== Biểu đồ 5: Docker stats — SO SÁNH CẢ 2 DATASET =====
    own_docker_stats = data.get("own_dataset_docker_stats", [])
    if data["docker_stats"] or own_docker_stats:
        fig5 = go.Figure()

        def cpu_series(stats_list):
            timestamps, cpu_values = [], []
            for s in stats_list:
                cpu_str = (s.get("cpu_perc") or "0%").replace("%", "")
                try:
                    cpu_values.append(float(cpu_str))
                    timestamps.append(s["timestamp_iso"])
                except ValueError:
                    continue
            return timestamps, cpu_values

        if data["docker_stats"]:
            ts, cpu = cpu_series(data["docker_stats"])
            fig5.add_trace(go.Scatter(x=ts, y=cpu, mode="lines+markers", name="Flickr30K — CPU % (AIModule)"))
        if own_docker_stats:
            ts2, cpu2 = cpu_series(own_docker_stats)
            fig5.add_trace(go.Scatter(x=ts2, y=cpu2, mode="lines+markers", name="Dataset tự thân — CPU % (AIModule)"))

        fig5.update_layout(title="Resource Usage theo thời gian — Container AIModule (cả 2 Dataset)", xaxis_title="Thời gian", yaxis_title="CPU %")
        charts["docker_stats"] = fig5.to_html(full_html=False, include_plotlyjs=False)

    return charts


def build_evidence_summary(data: dict[str, Any]) -> str:
    events = data["raw_events"]
    own_lat = data.get("own_dataset_latency")

    own_html = ""
    if own_lat:
        info = own_lat["dataset_info"]
        own_html = f"""
        <h3>Bằng chứng đo đạc — Dataset tự thân</h3>
        <ul>
            <li>Số ảnh đo latency thành công: <b>{info['successful_measurements']}/{info['sample_size_actual']}</b> (lỗi: {info['errors']})</li>
            <li>Thời điểm đo: <b>{own_lat['measured_at']}</b></li>
            <li>Phương pháp: tải ảnh thật qua GET /media (BackendModule) + presigned URL MinIO, đo latency gọi trực tiếp AIModule</li>
        </ul>
        """

    if not events:
        return own_html + "<p><em>Không có dữ liệu raw_events.jsonl (Flickr30K).</em></p>"

    started = next((e for e in events if e["event_type"] == "benchmark_started"), None)
    completed = next((e for e in events if e["event_type"] == "benchmark_completed"), None)
    embed_events = [e for e in events if e["event_type"] in ("embed_image", "embed_text")]
    sample_hashes = embed_events[:3]

    cache_size_mb = EMBEDDINGS_CACHE_PATH.stat().st_size / 1024 / 1024 if EMBEDDINGS_CACHE_PATH.exists() else 0

    rows_html = "".join(
        f"<tr><td>{e['timestamp_iso']}</td><td>{e['event_type']}</td>"
        f"<td>{e['latency_ms']}</td><td><code>{e['response_sha256'][:16]}...</code></td></tr>"
        for e in sample_hashes
    )

    html = f"""
    <h3>Bằng chứng vận hành thật — Flickr30K (raw_events.jsonl)</h3>
    <ul>
        <li>Tổng số request đã ghi log: <b>{len(embed_events)}</b></li>
        <li>Thời điểm bắt đầu: <b>{started['timestamp_iso'] if started else 'N/A'}</b></li>
        <li>Thời điểm hoàn tất: <b>{completed['timestamp_iso'] if completed else 'N/A'}</b></li>
        <li>File vector CLIP thật (embeddings_cache.npz): <b>{'Có' if EMBEDDINGS_CACHE_PATH.exists() else 'Không tìm thấy'}</b>
            ({cache_size_mb:.1f} MB)</li>
    </ul>
    <h4>Mẫu 3 request đầu tiên (kèm SHA256 hash của response thật từ AIModule):</h4>
    <table border="1" cellpadding="6" style="border-collapse: collapse;">
        <tr><th>Timestamp</th><th>Loại</th><th>Latency (ms)</th><th>SHA256 (16 ký tự đầu)</th></tr>
        {rows_html}
    </table>
    <p><em>Ghi chú: mỗi dòng trong raw_events.jsonl được ghi VÀ FLUSH XUỐNG ĐĨA ngay khi request hoàn thành
    (không phải ghi 1 lần lúc cuối) — kèm mã băm SHA256 của toàn bộ response body thật nhận từ AIModule.
    Vector CLIP thật (512 chiều) cho mọi ảnh/caption được lưu đầy đủ trong embeddings_cache.npz,
    cho phép kiểm chứng độc lập bằng cách tự tính lại cosine similarity.</em></p>
    """
    return own_html + html


def build_metrics_table_html(results: dict[str, Any]) -> str:
    rows = []
    for direction_key, direction_label in [("image_to_text", "Image → Text"), ("text_to_image", "Text → Image")]:
        for k, metrics in results[direction_key]["metrics_by_k"].items():
            rows.append(
                f"<tr><td>{direction_label}</td><td>k={k}</td>"
                f"<td>{metrics['mrr']:.4f}</td><td>{metrics['hit_rate']:.4f}</td>"
                f"<td>{metrics['precision']:.4f}</td><td>{metrics['recall']:.4f}</td></tr>"
            )
    rows_html = "".join(rows)
    return f"""
    <table border="1" cellpadding="6" style="border-collapse: collapse;">
        <tr><th>Chiều</th><th>Top-K</th><th>MRR</th><th>HitRate</th><th>Precision</th><th>Recall</th></tr>
        {rows_html}
    </table>
    """


def main() -> None:
    logger.info("Đang đọc dữ liệu đã lưu từ lần chạy benchmark trước...")
    data = load_all_data()

    logger.info("Đang sinh biểu đồ...")
    charts = build_charts(data)

    logger.info("Đang sinh bảng bằng chứng...")
    evidence_html = build_evidence_summary(data)
    metrics_table_html = build_metrics_table_html(data["results"])

    run_info = data["results"]["run_info"]
    dataset_info = data["results"]["dataset_info"]

    report_html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Báo cáo Benchmark CLIP — SISE</title>
<style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; max-width: 1100px; margin: 40px auto; padding: 0 20px; color: #222; }}
    h1 {{ color: #1a237e; border-bottom: 3px solid #1a237e; padding-bottom: 10px; }}
    h2 {{ color: #283593; margin-top: 40px; }}
    table {{ width: 100%; margin: 15px 0; }}
    th {{ background: #e8eaf6; }}
    .info-box {{ background: #f5f5f5; padding: 15px; border-left: 4px solid #1a237e; margin: 15px 0; }}
</style>
</head>
<body>
    <h1>Báo cáo Benchmark CLIP — Hệ thống SISE</h1>
    <div class="info-box">
        <b>Dataset:</b> {dataset_info['name']}<br>
        <b>Quy mô:</b> {dataset_info['sample_size']} ảnh, {dataset_info['total_captions']} caption<br>
        <b>Thời điểm chạy:</b> {run_info['started_at']}<br>
        <b>AI Service:</b> {run_info['ai_service_url']}
    </div>

    <h2>1. So sánh tổng quan các thực nghiệm</h2>
    {charts.get('comparison_bar', '')}

    <h2>2. Bảng chỉ số chi tiết theo nhiều mức Top-K</h2>
    {metrics_table_html}

    <h2>3. Phân phối vị trí kết quả đúng (Rank Distribution)</h2>
    {charts.get('rank_distribution', '')}

    <h2>4. Latency</h2>
    {charts.get('latency', '')}

    <h2>5. Breakdown theo danh tính — Dataset tự thân</h2>
    {charts.get('own_breakdown', '<p><em>Không có dữ liệu breakdown.</em></p>')}

    <h2>6. Resource Usage — Container AIModule</h2>
    {charts.get('docker_stats', '<p><em>Không có dữ liệu docker stats.</em></p>')}

    <h2>7. Bằng chứng vận hành (Evidence)</h2>
    {evidence_html}

    <p style="margin-top: 60px; color: #888; font-size: 0.9em;">
        Báo cáo này được sinh tự động bởi generate_report.py, đọc trực tiếp từ dữ liệu thô
        đã lưu trong lần chạy run_benchmark.py trước đó. Có thể chạy lại script này bất kỳ
        lúc nào (chỉ mất vài giây) để tái tạo báo cáo, không cần chạy lại benchmark.
    </p>
</body>
</html>"""

    REPORT_HTML_PATH.write_text(report_html, encoding="utf-8")
    logger.info("Đã sinh báo cáo: %s", REPORT_HTML_PATH)
    logger.info("Mở file này bằng trình duyệt để xem báo cáo đầy đủ.")


if __name__ == "__main__":
    main()