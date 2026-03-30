import json
import os
from typing import Dict, Any, Callable

from flask import Flask, redirect, render_template, request, Response

application: Flask = Flask(__name__)

# Set this based on your environment variable
IS_DEV: bool = os.environ.get("FLASK_ENV") == "development"


@application.context_processor
def vite_assets() -> Dict[str, Any]:
    """
    Flask context processor to inject Vite asset handling into templates.

    Returns:
        A dictionary containing the 'vite_tag' helper function and 'is_dev' status.
    """

    def vite_tag(entry: str) -> str:
        """
        Generates a script tag for a Vite entry point.

        In development, it points to the Vite dev server. In production,
        it parses the manifest.json to return the hashed file path.

        Args:
            entry: The source file path relative to the 'src/' directory.

        Returns:
            A string containing the HTML <script> tag or an empty string if
            the manifest is missing or the entry is not found.
        """
        if IS_DEV:
            return f'<script type="module" src="http://localhost:5173/src/{entry}"></script>'

        # Use 'application' instead of 'app'
        manifest_path: str = os.path.join(
            application.static_folder, "dist", ".vite", "manifest.json"
        )
        try:
            with open(manifest_path, "r") as f:
                manifest: Dict[str, Any] = json.load(f)
            hashed_file: str = manifest[f"src/{entry}"]["file"]
            print('<script type="module" src="/static/dist/{hashed_file}"></script>')
            return f'<script type="module" src="/static/dist/{hashed_file}"></script>'
        except (FileNotFoundError, KeyError, TypeError) as e:
            print(f"Vite manifest error: {e}")  # Check Heroku logs for this
            return f""

    return dict(vite_tag=vite_tag, is_dev=IS_DEV)


@application.route("/")
def index() -> Response:
    """
    Redirects the root URL to the items list.

    Returns:
        A redirect response to the '/items' endpoint.
    """
    return render_template("base.html")


@application.route("/items")
def items() -> str:
    """
    Renders the main items index page.

    Returns:
        The rendered HTML content of 'index.html'.
    """
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return render_template("items_content.html")
    return render_template("items.html")


@application.route("/skills")
def skills() -> str:
    """
    Renders the skills page.

    Returns:
        The rendered HTML content of 'skills.html'.
    """
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return render_template("skills_content.html")
    return render_template("skills.html")
