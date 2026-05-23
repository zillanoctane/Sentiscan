"""Endpoint hasil: list eksperimen, detail, export CSV/PDF."""
import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models.experiment import Experiment
from ..models.user import User
from ..schemas.experiment import ExperimentResponse, ExperimentSummary, Metrics

router = APIRouter(prefix="/api/results", tags=["results"])


@router.get("/experiments", response_model=list[ExperimentSummary])
def list_experiments(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Experiment)
          .filter(Experiment.user_id == user.id)
          .order_by(Experiment.created_at.desc())
          .all()
    )
    return [
        ExperimentSummary(
            id=e.id, name=e.name, dataset_id=e.dataset_id,
            test_size=float(e.test_size), knn_k=e.knn_k,
            best_algorithm=e.best_algorithm,
            nb_f1=(e.nb_metrics or {}).get("f1", 0),
            knn_f1=(e.knn_metrics or {}).get("f1", 0),
            created_at=e.created_at,
        )
        for e in rows
    ]


@router.get("/experiments/{exp_id}", response_model=ExperimentResponse)
def get_experiment(
    exp_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    e = _get_owned_exp(db, exp_id, user.id)
    return ExperimentResponse(
        id=e.id, name=e.name, dataset_id=e.dataset_id,
        test_size=float(e.test_size), knn_k=e.knn_k,
        nb_metrics=Metrics(**e.nb_metrics),
        knn_metrics=Metrics(**e.knn_metrics),
        best_algorithm=e.best_algorithm,
        duration_sec=float(e.duration_sec) if e.duration_sec else None,
        created_at=e.created_at,
    )


@router.get("/experiments/{exp_id}/export")
def export_experiment(
    exp_id: int,
    format: str = Query("csv", pattern="^(csv|pdf)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    e = _get_owned_exp(db, exp_id, user.id)
    if format == "csv":
        return _export_csv(e)
    return _export_pdf(e)


# ─── Helpers ─────────────────────────────────────────────
def _get_owned_exp(db: Session, exp_id: int, user_id: int) -> Experiment:
    e = db.query(Experiment).filter(Experiment.id == exp_id, Experiment.user_id == user_id).first()
    if not e:
        raise HTTPException(404, "Eksperimen tidak ditemukan.")
    return e


def _export_csv(e: Experiment) -> StreamingResponse:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Sentiscan — Hasil Eksperimen"])
    w.writerow(["Nama", e.name])
    w.writerow(["Tanggal", e.created_at.isoformat() if e.created_at else ""])
    w.writerow(["Test size", float(e.test_size)])
    w.writerow(["KNN k", e.knn_k])
    w.writerow(["Pemenang", e.best_algorithm])
    w.writerow([])
    w.writerow(["Metrik", "Naïve Bayes", "KNN"])
    nb, knn = e.nb_metrics or {}, e.knn_metrics or {}
    for m in ("accuracy", "precision", "recall", "f1"):
        w.writerow([m, nb.get(m), knn.get(m)])
    w.writerow([])
    w.writerow(["Confusion Matrix NB", str(nb.get("confusion_matrix"))])
    w.writerow(["Confusion Matrix KNN", str(knn.get("confusion_matrix"))])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sentiscan-exp{e.id}.csv"},
    )


def _export_pdf(e: Experiment) -> StreamingResponse:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, title=f"Sentiscan Eksperimen #{e.id}")
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"<b>Sentiscan — Laporan Eksperimen #{e.id}</b>", styles["Title"]))
    story.append(Paragraph(f"<i>{e.name or ''}</i>", styles["Normal"]))
    story.append(Spacer(1, 12))

    info = [
        ["Tanggal", e.created_at.strftime("%Y-%m-%d %H:%M") if e.created_at else "-"],
        ["Dataset ID", str(e.dataset_id)],
        ["Test size", str(float(e.test_size))],
        ["KNN k", str(e.knn_k)],
        ["Pemenang", e.best_algorithm],
        ["Durasi", f"{float(e.duration_sec or 0)} detik"],
    ]
    t = Table(info, colWidths=[120, 360])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#ece8df")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c4bba8")),
        ("FONT", (0, 0), (-1, -1), "Helvetica", 9),
    ]))
    story.append(t)
    story.append(Spacer(1, 18))

    story.append(Paragraph("<b>Perbandingan metrik</b>", styles["Heading2"]))
    nb, knn = e.nb_metrics or {}, e.knn_metrics or {}
    rows = [["Metrik", "Naïve Bayes", "KNN"]]
    for m in ("accuracy", "precision", "recall", "f1"):
        rows.append([
            m.capitalize(),
            f"{nb.get(m, 0):.4f}",
            f"{knn.get(m, 0):.4f}",
        ])
    t = Table(rows, colWidths=[120, 180, 180])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#14110d")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#f4f1ea")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c4bba8")),
        ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 18))

    story.append(Paragraph(
        f"<b>Kesimpulan:</b> Pemenang adalah <b>{e.best_algorithm}</b> dengan F1-score "
        f"{(nb if e.best_algorithm == 'naive_bayes' else knn).get('f1', 0):.4f}.",
        styles["Normal"],
    ))

    doc.build(story)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=sentiscan-exp{e.id}.pdf"},
    )
