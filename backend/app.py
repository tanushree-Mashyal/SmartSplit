from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)

CORS(app)


# ===============================
# DATABASE CONNECTION
# ===============================

def get_db_connection():
    connection = sqlite3.connect("smartsplit.db")
    connection.row_factory = sqlite3.Row
    return connection


# ===============================
# CREATE DATABASE TABLE
# ===============================

def create_table():

    connection = get_db_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            members INTEGER NOT NULL,
            total_expenses REAL DEFAULT 0
        )
    """)

    connection.commit()
    connection.close()


# ===============================
# HOME
# ===============================

@app.route("/")
def home():
    return "SmartSplit Backend is Running!"


# ===============================
# GET GROUPS
# ===============================

@app.route("/api/groups", methods=["GET"])
def get_groups():

    connection = get_db_connection()

    groups = connection.execute(
        "SELECT * FROM groups"
    ).fetchall()

    connection.close()

    groups_list = []

    for group in groups:

        groups_list.append({
            "id": group["id"],
            "name": group["name"],
            "members": group["members"],
            "total_expenses": group["total_expenses"]
        })

    return jsonify(groups_list)


# ===============================
# ADD GROUP
# ===============================

@app.route("/api/groups", methods=["POST"])
def add_group():

    data = request.get_json()

    group_name = data["name"]
    members = data["members"]

    connection = get_db_connection()

    cursor = connection.execute(
        """
        INSERT INTO groups (name, members)
        VALUES (?, ?)
        """,
        (group_name, members)
    )

    connection.commit()

    group_id = cursor.lastrowid

    connection.close()

    return jsonify({
        "message": "Group saved successfully",
        "id": group_id,
        "name": group_name,
        "members": members
    }), 201


# ===============================
# START SERVER
# ===============================

if __name__ == "__main__":

    create_table()

    app.run(debug=True)