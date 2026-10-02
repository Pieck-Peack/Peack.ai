import sqlite3

conn = sqlite3.connect("peack.db")
cursor = conn.cursor()

# Setzt alle Nutzer außer "pieck" auf normalen User-Status (is_owner = 0)
cursor.execute("UPDATE users SET is_owner = 0 WHERE username != 'pieck';")

conn.commit()
conn.close()
print("Datenbank erfolgreich aktualisiert!")