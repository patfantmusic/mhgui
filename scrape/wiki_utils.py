def clean_cell(cell):
    """Safely extracts the primary text from a cell list/tuple."""
    if not isinstance(cell, (list, tuple)) or len(cell) < 2:
        return str(cell).strip()

    # Logic: Prefer index 1 if 0 is empty, else 0
    primary = cell[1] if (not cell[0] and cell[1]) else cell[0]
    return str(primary).strip()
