import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    PageBreak,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OPENAPI_PATH = ROOT / "docs" / "openapi.json"
OUTPUT_PATH = ROOT / "output" / "pdf" / "swagger.pdf"
METHODS = ("get", "post", "put", "patch", "delete")

with OPENAPI_PATH.open(encoding="utf-8") as source:
    spec = json.load(source)

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontSize=28, leading=34, textColor=colors.HexColor("#1565C0"), alignment=TA_CENTER, spaceAfter=14))
styles.add(ParagraphStyle(name="CoverSub", parent=styles["Normal"], fontSize=12, leading=18, textColor=colors.HexColor("#455A64"), alignment=TA_CENTER))
styles.add(ParagraphStyle(name="Endpoint", parent=styles["Heading2"], fontSize=14, leading=18, textColor=colors.HexColor("#0D47A1"), spaceBefore=6, spaceAfter=7))
styles.add(ParagraphStyle(name="Tiny", parent=styles["Normal"], fontSize=7.8, leading=10))
styles.add(ParagraphStyle(name="ApiCode", parent=styles["Normal"], fontName="Courier", fontSize=7.3, leading=9, backColor=colors.HexColor("#F5F7FA"), borderPadding=5))

operations = []
for path, item in spec.get("paths", {}).items():
    for method in METHODS:
        if method in item:
            operations.append((path, method.upper(), item[method]))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D9E2EC"))
    canvas.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#607D8B"))
    canvas.drawString(18 * mm, 9 * mm, "Dashboard API · OpenAPI 3")
    canvas.drawRightString(192 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(str(OUTPUT_PATH), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=18 * mm, bottomMargin=20 * mm, title="Dashboard Swagger API Reference", author="Dashboard Project")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="content")
doc.addPageTemplates(PageTemplate(id="all", frames=frame, onPage=footer))

story = [Spacer(1, 48 * mm), Paragraph("Dashboard API", styles["CoverTitle"]), Paragraph("Swagger / OpenAPI Printable Reference", styles["CoverSub"]), Spacer(1, 16 * mm)]
meta = [
    ["Version", spec.get("info", {}).get("version", "1.0")],
    ["Base URL", "http://localhost:3001"],
    ["Swagger UI", "http://localhost:3001/api/docs"],
    ["OpenAPI JSON", "http://localhost:3001/api/docs-json"],
    ["Authentication", "Bearer JWT (access-token)"],
    ["Documented operations", str(len(operations))],
]
cover_table = Table(meta, colWidths=[42 * mm, 92 * mm])
cover_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E3F2FD")), ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#0D47A1")), ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#BBDEFB")), ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"), ("FONTNAME", (1, 0), (1, -1), "Helvetica"), ("FONTSIZE", (0, 0), (-1, -1), 9), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
story += [cover_table, Spacer(1, 24 * mm), Paragraph("Generated from the running NestJS service. Request schemas, validation constraints, security requirements, and response codes reflect the exported OpenAPI contract.", styles["CoverSub"]), PageBreak()]

story += [Paragraph("API overview", styles["Heading1"]), Paragraph(spec.get("info", {}).get("description", ""), styles["BodyText"]), Spacer(1, 5 * mm)]
overview_data = [["Method", "Path", "Tag", "Summary"]]
for path, method, operation in operations:
    overview_data.append([method, path, ", ".join(operation.get("tags", [])), operation.get("summary", "")])
overview = Table(overview_data, colWidths=[17 * mm, 59 * mm, 25 * mm, 73 * mm], repeatRows=1)
overview.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1565C0")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 7.2), ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CFD8DC")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAFC")]), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
story += [overview, PageBreak()]

for index, (path, method, operation) in enumerate(operations, 1):
    tag = ", ".join(operation.get("tags", []))
    title = f"{index}. {method} {path}"
    blocks = [Paragraph(title, styles["Endpoint"]), Paragraph(f"<b>{operation.get('summary', '')}</b>", styles["BodyText"])]
    if operation.get("description"):
        blocks.append(Paragraph(operation["description"], styles["Tiny"]))
    blocks.append(Spacer(1, 2 * mm))
    info = [["Tag", tag], ["Security", "Bearer JWT" if operation.get("security") else "Public"]]
    info_table = Table(info, colWidths=[28 * mm, 140 * mm])
    info_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E3F2FD")), ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"), ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CFD8DC")), ("FONTSIZE", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    blocks.append(info_table)

    params = operation.get("parameters", [])
    if params:
        blocks += [Spacer(1, 3 * mm), Paragraph("Parameters", styles["Heading3"])]
        rows = [["Name", "In", "Required", "Type / description"]]
        for param in params:
            schema = param.get("schema", {})
            shape = schema.get("type", "")
            if schema.get("format"):
                shape += f" ({schema['format']})"
            description = param.get("description", "")
            rows.append([param.get("name", ""), param.get("in", ""), "Yes" if param.get("required") else "No", f"{shape} {description}".strip()])
        table = Table(rows, colWidths=[30 * mm, 18 * mm, 20 * mm, 100 * mm], repeatRows=1)
        table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ECEFF1")), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CFD8DC")), ("FONTSIZE", (0, 0), (-1, -1), 7.5), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
        blocks.append(table)

    body = operation.get("requestBody")
    if body:
        schema = body.get("content", {}).get("application/json", {}).get("schema", {})
        blocks += [Spacer(1, 3 * mm), Paragraph("Request body (application/json)", styles["Heading3"]), Paragraph(json.dumps(schema, ensure_ascii=False, indent=2).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>"), styles["ApiCode"])]

    rows = [["Status", "Description"]]
    for status, response in operation.get("responses", {}).items():
        rows.append([status, response.get("description", "")])
    blocks += [Spacer(1, 3 * mm), Paragraph("Responses", styles["Heading3"])]
    response_table = Table(rows, colWidths=[23 * mm, 145 * mm], repeatRows=1)
    response_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ECEFF1")), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CFD8DC")), ("FONTSIZE", (0, 0), (-1, -1), 8), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    blocks.append(response_table)
    story += [KeepTogether(blocks), Spacer(1, 6 * mm)]

story += [PageBreak(), Paragraph("Testing companion", styles["Heading1"]), Paragraph("The Postman collection covers all 18 operations with 90 requests and 450 automated assertions. It checks status codes, invalid and empty inputs, response JSON contracts, authentication, CRUD cleanup, and response-time thresholds.", styles["BodyText"]), Spacer(1, 4 * mm), Paragraph("Files: postman/api.postman_collection.json · postman/local.postman_environment.json · postman/reports/newman-report.html", styles["ApiCode"])]

doc.build(story)
print(OUTPUT_PATH)
