from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.services.export_service import generate_msproject_xml

router = APIRouter()


@router.get("/export/{project_id}")
async def export_project(project_id: str, format: str = "xml"):
    from app.routes.schedule import _projects

    if project_id not in _projects:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    project = _projects[project_id]

    if format == "xml":
        xml_content = generate_msproject_xml(project)
        filename = project.name.replace(" ", "_").replace("/", "-") + ".xml"
        return Response(
            content=xml_content,
            media_type="application/xml",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
