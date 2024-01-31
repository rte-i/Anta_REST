from starlette.testclient import TestClient

from antarest.core.tasks.model import TaskDTO, TaskStatus


class TestDiskUsage:
    def test_disk_usage_endpoint(
        self,
        client: TestClient,
        user_access_token: str,
        study_id: str,
    ) -> None:
        """
        Verify the functionality of the disk usage endpoint:

        - Ensure a successful response is received.
        - Confirm that the JSON response is an integer which represent a (big enough) directory size.
        """
        disk_usage: int

        user_headers = {"Authorization": f"Bearer {user_access_token}"}
        res = client.get(
            f"/v1/studies/{study_id}/disk-usage",
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()
        disk_usage = res.json()  # currently: 7.47 Mio on Ubuntu
        assert 7 * 1024 * 1024 < disk_usage < 8 * 1024 * 1024

        # Copy the study in managed workspace in order to create a variant
        res = client.post(
            f"/v1/studies/{study_id}/copy",
            headers=user_headers,
            params={"dest": "somewhere", "use_task": "false"},
        )
        res.raise_for_status()
        parent_id: str = res.json()

        # Create variant of the copied study
        res = client.post(
            f"/v1/studies/{parent_id}/variants",
            headers=user_headers,
            params={"name": "Variant Test"},
        )
        res.raise_for_status()
        variant_id: str = res.json()

        # Ensure a successful response is received even if the variant has no snapshot
        res = client.get(
            f"/v1/studies/{variant_id}/disk-usage",
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()
        disk_usage = res.json()
        assert disk_usage == 0

        # Generate a snapshot for the variant
        res = client.put(
            f"/v1/studies/{variant_id}/generate",
            headers={"Authorization": f"Bearer {user_access_token}"},
            params={"denormalize": True, "from_scratch": True},
        )
        res.raise_for_status()
        task_id = res.json()

        # wait for task completion
        res = client.get(f"/v1/tasks/{task_id}?wait_for_completion=true", headers=user_headers)
        assert res.status_code == 200
        task_result = TaskDTO.parse_obj(res.json())
        assert task_result.status == TaskStatus.COMPLETED
        assert task_result.result.success

        # Ensure a successful response is received and the disk usage is not zero
        res = client.get(
            f"/v1/studies/{variant_id}/disk-usage",
            headers=user_headers,
        )
        assert res.status_code == 200, res.json()
        disk_usage = res.json()  # currently: 6.38 Mio on Ubuntu.
        assert 6 * 1024 * 1024 < disk_usage < 7 * 1024 * 1024
