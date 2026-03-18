import duckdb


class DBClient:
    def __init__(self):
        self.conn = duckdb.connect(database="mhgu.db")

    def __del__(self):
        self.conn.close()

    def get_armor(self, hr: int = 11, village: int = 11):
        query = """
            SELECT
                armor.id,
                armor.name,
                armor.slots,
                armor.hr_required,
                armor.village_required,
                armor_skills.ability_id
            FROM armor
            JOIN armor_skills ON armor.id = armor_skills.armor_id
            WHERE armor.hr_required <= ?
            AND armor.village_required <= ?
        """
        results = self.conn.execute(query, [hr, village]).fetchall()
        return results

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
            FROM wiki_items
            WHERE name ILIKE ?
            AND category NOT IN (SELECT unnest(?))
        """
        results = self.conn.execute(query, [pattern, exclude or []])
        return [dict(zip(fields, row)) for row in results.fetchall()]


def main():
    client = DBClient()
    print(client.get_armor([]))


if __name__ == "__main__":
    main()
