import pytest
from starlette.testclient import TestClient


@pytest.mark.unit_test
class TestSTStorage:
    """
    Test the end points related to binding constraints.
    """

    def test_lifecycle__nominal(self, client: TestClient, user_access_token: str) -> None:
        user_headers = {"Authorization": f"Bearer {user_access_token}"}

        res = client.post(
            "/v1/studies",
            headers=user_headers,
            params={"name": "foo"},
        )
        assert res.status_code == 201, res.json()
        study_id = res.json()

        area1_name = "area1"
        area2_name = "area2"
        res = client.post(
            f"/v1/studies/{study_id}/areas",
            headers=user_headers,
            json={
                "name": area1_name,
                "type": "AREA",
                "metadata": {"country": "FR"},
            },
        )
        assert res.status_code == 200, res.json()

        res = client.post(
            f"/v1/studies/{study_id}/areas",
            headers=user_headers,
            json={
                "name": area2_name,
                "type": "AREA",
                "metadata": {"country": "DE"},
            },
        )
        assert res.status_code == 200, res.json()

        res = client.post(
            f"/v1/studies/{study_id}/links",
            headers=user_headers,
            json={
                "area1": area1_name,
                "area2": area2_name,
            },
        )
        assert res.status_code == 200, res.json()

        # Create Variant
        res = client.post(
            f"/v1/studies/{study_id}/variants",
            headers=user_headers,
            params={"name": "Variant 1"},
        )
        assert res.status_code == 200, res.json()
        variant_id = res.json()

        # Create Binding constraints
        res = client.post(
            f"/v1/studies/{variant_id}/commands",
            json=[
                {
                    "action": "create_binding_constraint",
                    "args": {
                        "name": "binding_constraint_1",
                        "enabled": True,
                        "time_step": "hourly",
                        "operator": "less",
                        "coeffs": {},
                        "comments": "",
                    },
                }
            ],
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()

        res = client.post(
            f"/v1/studies/{variant_id}/commands",
            json=[
                {
                    "action": "create_binding_constraint",
                    "args": {
                        "name": "binding_constraint_2",
                        "enabled": True,
                        "time_step": "hourly",
                        "operator": "less",
                        "coeffs": {},
                        "comments": "",
                    },
                }
            ],
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()

        # Get Binding Constraint list
        res = client.get(f"/v1/studies/{variant_id}/bindingconstraints", headers=user_headers)
        binding_constraints_list = res.json()
        assert res.status_code == 200, res.json()
        assert len(binding_constraints_list) == 2
        assert binding_constraints_list[0]["id"] == "binding_constraint_1"
        assert binding_constraints_list[1]["id"] == "binding_constraint_2"

        bc_id = binding_constraints_list[0]["id"]

        # Update element of Binding constraint
        new_comment = "We made it !"
        res = client.put(
            f"v1/studies/{variant_id}/bindingconstraints/{bc_id}",
            json={"key": "comments", "value": new_comment},
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()

        # Get Binding Constraint
        res = client.get(
            f"/v1/studies/{variant_id}/bindingconstraints/{bc_id}",
            headers=user_headers,
        )
        binding_constraint = res.json()
        comments = binding_constraint["comments"]
        assert res.status_code == 200, res.json()
        assert comments == new_comment

        # Add Constraint term
        area1_name = "area1"
        area2_name = "area2"

        res = client.post(
            f"/v1/studies/{variant_id}/bindingconstraints/{bc_id}/term",
            json={
                "weight": 1,
                "offset": 2,
                "data": {"area1": area1_name, "area2": area2_name},
            },
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()

        # Get Binding Constraint
        res = client.get(
            f"/v1/studies/{variant_id}/bindingconstraints/{bc_id}",
            headers=user_headers,
        )
        binding_constraint = res.json()
        constraints = binding_constraint["constraints"]
        assert res.status_code == 200, res.json()
        assert binding_constraint["id"] == bc_id
        assert len(constraints) == 1
        assert constraints[0]["id"] == f"{area1_name}%{area2_name}"
        assert constraints[0]["weight"] == 1
        assert constraints[0]["offset"] == 2
        assert constraints[0]["data"]["area1"] == area1_name
        assert constraints[0]["data"]["area2"] == area2_name

        # Update Constraint term
        res = client.put(
            f"/v1/studies/{variant_id}/bindingconstraints/{bc_id}/term",
            json={
                "id": f"{area1_name}%{area2_name}",
                "weight": 3,
            },
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()

        # Get Binding Constraint
        res = client.get(
            f"/v1/studies/{variant_id}/bindingconstraints/{bc_id}",
            headers=user_headers,
        )
        binding_constraint = res.json()
        constraints = binding_constraint["constraints"]
        assert res.status_code == 200, res.json()
        assert binding_constraint["id"] == bc_id
        assert len(constraints) == 1
        assert constraints[0]["id"] == f"{area1_name}%{area2_name}"
        assert constraints[0]["weight"] == 3
        assert constraints[0]["offset"] is None
        assert constraints[0]["data"]["area1"] == area1_name
        assert constraints[0]["data"]["area2"] == area2_name

        # Remove Constraint term
        res = client.delete(
            f"/v1/studies/{variant_id}/bindingconstraints/{bc_id}/term/{area1_name}%{area2_name}",
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()

        # Get Binding Constraint
        res = client.get(
            f"/v1/studies/{variant_id}/bindingconstraints/{bc_id}",
            headers=user_headers,
        )
        binding_constraint = res.json()
        constraints = binding_constraint["constraints"]
        assert res.status_code == 200, res.json()
        assert constraints is None

        # Creates a binding constraint with the new API
        res = client.post(
            f"/v1/studies/{variant_id}/bindingconstraints",
            json={
                "name": "binding_constraint_3",
                "enabled": True,
                "time_step": "hourly",
                "operator": "less",
                "coeffs": {},
                "comments": "New API",
            },
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()

        # Asserts that creating 2 binding constraints with the same name raises an Exception
        res = client.post(
            f"/v1/studies/{variant_id}/bindingconstraints",
            json={
                "name": "binding_constraint_3",
                "enabled": True,
                "time_step": "hourly",
                "operator": "less",
                "coeffs": {},
                "comments": "New API",
            },
            headers=user_headers,
        )
        assert res.status_code == 409, res.json()
        assert res.json() == {
            "description": "A binding constraint with the same name already exists: binding_constraint_3.",
            "exception": "DuplicateConstraintName",
        }

        # Assert empty name
        res = client.post(
            f"/v1/studies/{variant_id}/bindingconstraints",
            json={
                "name": "  ",
                "enabled": True,
                "time_step": "hourly",
                "operator": "less",
                "coeffs": {},
                "comments": "New API",
            },
            headers=user_headers,
        )
        assert res.status_code == 400, res.json()
        assert res.json() == {
            "description": "Invalid binding constraint name:   .",
            "exception": "InvalidConstraintName",
        }

        # Assert invalid special characters
        res = client.post(
            f"/v1/studies/{variant_id}/bindingconstraints",
            json={
                "name": "%%**",
                "enabled": True,
                "time_step": "hourly",
                "operator": "less",
                "coeffs": {},
                "comments": "New API",
            },
            headers=user_headers,
        )
        assert res.status_code == 400, res.json()
        assert res.json() == {
            "description": "Invalid binding constraint name: %%**.",
            "exception": "InvalidConstraintName",
        }

        # Asserts that only 3 binding constraints have been created
        res = client.get(f"/v1/studies/{variant_id}/bindingconstraints", headers=user_headers)
        assert res.status_code == 200, res.json()
        assert len(res.json()) == 3

        # The user change the time_step to daily instead of hourly.
        # We must check that the matrix is a daily/weekly matrix.
        res = client.put(
            f"/v1/studies/{variant_id}/bindingconstraints/{bc_id}",
            json={"key": "time_step", "value": "daily"},
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()

        # Check the last command is a change time_step
        res = client.get(f"/v1/studies/{variant_id}/commands", headers=user_headers)
        commands = res.json()
        args = commands[-1]["args"]
        assert args["time_step"] == "daily"
        assert args["values"] is not None, "We should have a matrix ID (sha256)"

        # Check that the matrix is a daily/weekly matrix
        res = client.get(
            f"/v1/studies/{variant_id}/raw",
            params={"path": f"input/bindingconstraints/{bc_id}", "depth": 1, "formatted": True},
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()
        dataframe = res.json()
        assert len(dataframe["index"]) == 366
        assert len(dataframe["columns"]) == 3  # less, equal, greater
