import duckdb
import os


def main():
    conn = duckdb.connect("static/mhgu.duckdb")
    csv_path = "static/data"

    for file in os.listdir(csv_path):
        if file.endswith(".csv"):
            table_name = os.path.splitext(file)[0]
            conn.execute(
                f"CREATE TABLE IF NOT EXISTS {table_name} AS SELECT * FROM '{os.path.join(csv_path, file)}'"
            )

    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS materials
        AS SELECT * FROM 'static/data/materials_gu.csv' UNION ALL SELECT * FROM 'static/data/materials_gen.csv'
        """
    )

    conn.close()


if __name__ == "__main__":
    main()
