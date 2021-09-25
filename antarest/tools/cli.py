import logging
from pathlib import Path
from typing import Optional

import click

from antarest.tools.lib import (
    generate_diff,
    extract_commands,
    apply_commands_from_dir,
    generate_study,
)

logging.basicConfig(level=logging.INFO)


@click.group()
def commands() -> None:
    pass


@commands.command()
@click.option(
    "--host",
    "-h",
    nargs=1,
    required=False,
    type=str,
    help="Host URL of the antares web instance",
)
@click.option(
    "--auth_token",
    nargs=1,
    required=False,
    default=None,
    type=str,
    help="Authentication token if server needs one",
)
@click.option(
    "--output",
    "-o",
    nargs=1,
    required=False,
    type=str,
    help="Output study path",
)
@click.option(
    "--input",
    "-i",
    nargs=1,
    required=True,
    type=click.Path(exists=True),
    help="Variant script source path",
)
@click.option(
    "--study_id",
    "-s",
    nargs=1,
    required=False,
    type=str,
    help="ID of the variant to apply the script onto",
)
def apply_script(
    input: str,
    study_id: Optional[str],
    output: Optional[str] = None,
    host: Optional[str] = None,
    auth_token: Optional[str] = None,
) -> None:
    """Apply a variant script onto an AntaresWeb study variant"""
    if output is None and host is None:
        print("--output or --host must be set")
        exit(1)
    if output is not None and host is not None:
        print("only --output or --host must be set")
        exit(1)
    if host is not None and study_id is None:
        print("--study_id must be set")
        exit(1)

    res = generate_study(Path(input), study_id, output, host, auth_token)
    print(res)


@commands.command()
@click.option(
    "--input",
    "-i",
    nargs=1,
    required=True,
    type=click.Path(exists=True),
    help="Study path",
)
@click.option(
    "--output",
    "-o",
    nargs=1,
    required=True,
    type=click.Path(exists=False),
    help="Script output path",
)
def generate_script(input: str, output: str) -> None:
    """Generate variant script commands from a study"""
    extract_commands(Path(input), Path(output))


@commands.command()
@click.option(
    "--base",
    nargs=1,
    required=True,
    type=click.Path(exists=True),
    help="Base study path",
)
@click.option(
    "--variant",
    nargs=1,
    required=True,
    type=click.Path(exists=True),
    help="Variant study path",
)
@click.option(
    "--output",
    "-o",
    nargs=1,
    required=True,
    type=click.Path(exists=False),
    help="Script output path",
)
def generate_script_diff(base: str, variant: str, output: str) -> None:
    """Generate variant script commands from two variant script directories"""
    generate_diff(Path(base), Path(variant), Path(output))


if __name__ == "__main__":
    commands()
