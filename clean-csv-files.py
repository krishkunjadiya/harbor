"""
Clean CSV Files - Remove Denormalized Columns
==============================================
Removes calculated/aggregate columns from CSV files.
The database triggers will auto-calculate these values.

Run this before re-seeding the database from CSVs.
"""

import csv
import os
from pathlib import Path

# Configuration: Which columns to remove from which files
CLEANUP_CONFIG = {
    'courses.csv': ['total_students'],
    'faculty.csv': ['total_courses', 'total_students'],
    'departments.csv': ['total_students', 'total_faculty', 'total_courses'],
    'universities.csv': ['total_students', 'total_faculty'],
    'students.csv': ['gpa'],  # Will sync from transcripts
    'jobs.csv': ['applications_count'],
    'user_skills.csv': ['endorsements']
}

def clean_csv_file(file_path, columns_to_remove):
    """Remove specified columns from a CSV file."""
    
    # Read the CSV
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    # Check which columns actually exist
    existing_columns_to_remove = [col for col in columns_to_remove if col in fieldnames]
    
    if not existing_columns_to_remove:
        print(f"  ⚠️  No columns to remove (might already be clean)")
        return False
    
    # Create new fieldnames without the removed columns
    new_fieldnames = [f for f in fieldnames if f not in columns_to_remove]
    
    # Create backup
    backup_path = file_path.with_name(file_path.stem + '_BACKUP.csv')
    os.rename(file_path, backup_path)
    print(f"  💾 Backup created: {backup_path.name}")
    
    # Write cleaned CSV
    with open(file_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=new_fieldnames)
        writer.writeheader()
        
        for row in rows:
            # Remove the specified columns
            cleaned_row = {k: v for k, v in row.items() if k in new_fieldnames}
            writer.writerow(cleaned_row)
    
    print(f"  ✅ Removed columns: {', '.join(existing_columns_to_remove)}")
    return True

def main():
    seed_dir = Path('seed-csv')
    
    if not seed_dir.exists():
        print("❌ seed-csv directory not found!")
        return
    
    print("🧹 CLEANING CSV FILES")
    print("=" * 60)
    print("Removing denormalized columns that will be auto-calculated")
    print("by database triggers.\n")
    
    cleaned_count = 0
    skipped_count = 0
    
    for filename, columns_to_remove in CLEANUP_CONFIG.items():
        file_path = seed_dir / filename
        
        if not file_path.exists():
            print(f"⏭️  {filename}: File not found, skipping")
            skipped_count += 1
            continue
        
        print(f"📄 {filename}")
        if clean_csv_file(file_path, columns_to_remove):
            cleaned_count += 1
        else:
            skipped_count += 1
        print()
    
    print("=" * 60)
    print(f"✅ Cleaned: {cleaned_count} files")
    print(f"⏭️  Skipped: {skipped_count} files")
    print("\n📋 NEXT STEPS:")
    print("1. Review the cleaned CSV files")
    print("2. Re-import them to your database")
    print("3. Run sections 1-8 of fix-all-data-mismatches.sql")
    print("   to populate the calculated columns")
    print("4. The triggers will keep them in sync automatically!")

if __name__ == '__main__':
    main()
