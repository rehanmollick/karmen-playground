import xml.etree.ElementTree as ET
from app.models.schedule import Project


def generate_msproject_xml(project: Project) -> str:
    """Generate MS Project-compatible XML."""
    root = ET.Element("Project", xmlns="http://schemas.microsoft.com/project")
    ET.SubElement(root, "Name").text = project.name
    ET.SubElement(root, "StartDate").text = f"{project.start_date}T08:00:00"

    tasks_elem = ET.SubElement(root, "Tasks")
    uid = 1
    act_uid_map: dict = {}

    def add_wbs_node(node, level):
        nonlocal uid
        t = ET.SubElement(tasks_elem, "Task")
        ET.SubElement(t, "UID").text = str(uid)
        ET.SubElement(t, "ID").text = str(uid)
        ET.SubElement(t, "Name").text = node.name
        ET.SubElement(t, "OutlineLevel").text = str(level)
        ET.SubElement(t, "Summary").text = "1"
        uid += 1
        for child in node.children:
            add_wbs_node(child, level + 1)

    for wbs_node in project.wbs:
        add_wbs_node(wbs_node, 1)

    for act in project.activities:
        t = ET.SubElement(tasks_elem, "Task")
        ET.SubElement(t, "UID").text = str(uid)
        ET.SubElement(t, "ID").text = str(uid)
        ET.SubElement(t, "Name").text = act.name
        ET.SubElement(t, "OutlineLevel").text = "2"
        hours = act.duration_days * 8
        ET.SubElement(t, "Duration").text = f"PT{hours}H0M0S"
        if act.start_date:
            ET.SubElement(t, "Start").text = f"{act.start_date}T08:00:00"
        if act.end_date:
            ET.SubElement(t, "Finish").text = f"{act.end_date}T17:00:00"
        if act.is_milestone:
            ET.SubElement(t, "Milestone").text = "1"
        if act.is_critical:
            ET.SubElement(t, "Critical").text = "1"
        act_uid_map[act.id] = uid
        uid += 1

    # Predecessor links
    for act in project.activities:
        if not act.predecessors:
            continue
        task_uid = act_uid_map.get(act.id)
        if not task_uid:
            continue
        for task_el in tasks_elem.findall("Task"):
            uid_el = task_el.find("UID")
            if uid_el is not None and uid_el.text == str(task_uid):
                for dep in act.predecessors:
                    if dep.predecessor_id in act_uid_map:
                        pl = ET.SubElement(task_el, "PredecessorLink")
                        ET.SubElement(pl, "PredecessorUID").text = str(
                            act_uid_map[dep.predecessor_id]
                        )
                        type_map = {"FS": "1", "SS": "3", "FF": "2", "SF": "4"}
                        ET.SubElement(pl, "Type").text = type_map.get(dep.type, "1")
                        ET.SubElement(pl, "LinkLag").text = str(dep.lag_days * 480)
                break

    ET.indent(root, space="  ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(
        root, encoding="unicode"
    )
