from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response

from app.services.export_service import generate_msproject_xml
from app.services.project_store import get_project

router = APIRouter()


@router.get("/export/{project_id}")
async def export_project(project_id: str, request: Request, format: str = "xml", session_id: str = ""):
    sid = session_id or request.headers.get("x-session-id", "")
    project = get_project(project_id, sid)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    if format == "xml":
        xml_content = generate_msproject_xml(project)
        # Strip non-ASCII chars (em dashes etc.) so Content-Disposition header stays latin-1 safe
        safe_name = project.name.encode("ascii", "ignore").decode("ascii")
        filename = safe_name.replace(" ", "_").replace("/", "-").strip("_") + ".xml"
        return Response(
            content=xml_content,
            media_type="application/xml",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
