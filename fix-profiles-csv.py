import csv

# Read the CSV file
with open('seed-csv/profiles.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    rows = list(reader)

# Fix user_type based on role
for row in rows:
    role = row['role']
    # Map role to correct user_type
    if role == 'student':
        row['user_type'] = 'student'
    elif role == 'recruiter':
        row['user_type'] = 'recruiter'
    elif role in ['faculty', 'admin_staff']:
        row['user_type'] = 'university'
    elif role == 'admin':
        row['user_type'] = 'admin'
    elif role == 'university_admin':
        row['user_type'] = 'university'
    else:
        # Default to student if unknown role
        print(f"Warning: Unknown role '{role}' for {row['email']}, setting to student")
        row['user_type'] = 'student'

# Write back to CSV
with open('seed-csv/profiles.csv', 'w', encoding='utf-8', newline='') as file:
    fieldnames = rows[0].keys()
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Fixed {len(rows)} rows in profiles.csv")

# Count by user_type
user_types = {}
for row in rows:
    user_type = row['user_type']
    user_types[user_type] = user_types.get(user_type, 0) + 1

print("\nUser type distribution:")
for user_type, count in sorted(user_types.items()):
    print(f"  {user_type}: {count}")
