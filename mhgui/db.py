import duckdb


class DBClient:
    def __init__(self):
        self.conn = duckdb.connect(database=":memory:")
        self.conn.execute(
            "CREATE TABLE items AS SELECT * FROM 'mhgui/scrape/data/items.csv';"
            "CREATE TABLE materials AS SELECT * FROM 'mhgui/scrape/data/materials.csv';"
        )

    def __del__(self):
        self.conn.close()

    def search_items(self, text: str | None = None, exclude: list[str] | None = None):
        fields = [
            "name",
            "rarity",
            "capacity",
            "value",
            "how_to_get",
            "category",
            "icon",
        ]
        pattern = f"%{text}%"
        query = f"""
            SELECT {", ".join(fields)}
            FROM items
            WHERE name ILIKE ?
            AND category NOT IN (SELECT unnest(?))
        """
        results = self.conn.execute(query, [pattern, exclude or []])
        return [dict(zip(fields, row)) for row in results.fetchall()]

    def search_materials(self, text: str | None = None):
        fields = ["name", "rarity", "value", "description", "icon"]
        pattern = f"%{text}%"
        query = f"""
            SELECT {", ".join(fields)}
            FROM materials
            WHERE name ILIKE ?
        """
        results = self.conn.execute(query, [pattern])
        return [dict(zip(fields, row)) for row in results.fetchall()]


def main():
    client = DBClient()
    print(client.get_armor([]))


if __name__ == "__main__":
    main()
