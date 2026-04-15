"""
CSV Data Validator for Harbor Platform
Checks all CSV files for common data issues and schema mismatches
"""

import csv
import os
from pathlib import Path
from datetime import datetime
import re

def validate_uuid(value):
    """Check if string is valid UUID format"""
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.I)
    return bool(uuid_pattern.match(str(value)))

def validate_email(value):
    """Check if string is valid email format"""
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    return bool(email_pattern.match(str(value)))

def validate_date(value):
    """Check if string is valid date format"""
    date_formats = ['%Y-%m-%d', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%d %H:%M:%S']
    for fmt in date_formats:
        try:
            datetime.strptime(value, fmt)
            return True
        except:
            continue
    return False

def check_csv_file(filepath):
    """Validate a single CSV file"""
    issues = []
    filename = os.path.basename(filepath)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames
            
            if not headers:
                return [(filename, 0, "ERROR", "No headers found")]
            
            row_count = 0
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (1 is headers)
                row_count += 1
                
                # Check for empty required fields
                for field, value in row.items():
                    # UUID validation for id fields
                    if field.endswith('_id') or field == 'id':
                        if not validate_uuid(value):
                            issues.append((filename, row_num, "WARNING", f"Invalid UUID format in {field}: {value}"))
                    
                    # Email validation
                    if field == 'email' and value:
                        if not validate_email(value):
                            issues.append((filename, row_num, "WARNING", f"Invalid email format: {value}"))
                    
                    # Date validation
                    if 'date' in field.lower() or 'at' in field.lower():
                        if value and not validate_date(value):
                            issues.append((filename, row_num, "WARNING", f"Invalid date format in {field}: {value}"))
                    
                    # Check for null/empty critical fields
                    critical_fields = ['id', 'email', 'name', 'user_type']
                    if field in critical_fields and not value:
                        issues.append((filename, row_num, "ERROR", f"Empty critical field: {field}"))
            
            print(f"✓ {filename}: {row_count} rows validated")
            
    except Exception as e:
        issues.append((filename, 0, "ERROR", f"Failed to read file: {str(e)}"))
    
    return issues

def main():
    """Main validation function"""
    csv_dir = Path('seed-csv')
    
    if not csv_dir.exists():
        print("❌ seed-csv directory not found!")
        return
    
    print("="*70)
    print("CSV DATA VALIDATION REPORT")
    print("="*70)
    print()
    
    all_issues = []
    csv_files = list(csv_dir.glob('*.csv'))
    
    if not csv_files:
        print("❌ No CSV files found in seed-csv directory")
        return
    
    for csv_file in sorted(csv_files):
        issues = check_csv_file(csv_file)
        all_issues.extend(issues)
    
    print()
    print("="*70)
    print("ISSUES FOUND")
    print("="*70)
    
    if not all_issues:
        print("✓ No issues found! All CSV files are valid.")
    else:
        errors = [i for i in all_issues if i[2] == "ERROR"]
        warnings = [i for i in all_issues if i[2] == "WARNING"]
        
        print(f"\n📊 Summary: {len(errors)} errors, {len(warnings)} warnings")
        print()
        
        if errors:
            print("❌ ERRORS:")
            for filename, row, level, message in errors:
                print(f"  {filename}:{row} - {message}")
            print()
        
        if warnings:
            print("⚠️  WARNINGS:")
            for filename, row, level, message in warnings[:20]:  # Show first 20
                print(f"  {filename}:{row} - {message}")
            if len(warnings) > 20:
                print(f"  ... and {len(warnings) - 20} more warnings")
            print()
    
    print("="*70)
    
    # Additional schema checks
    print("\nSCHEMA COMPATIBILITY CHECKS:")
    print("-" * 70)
    
    # Check profiles.csv for user_type validity
    profiles_path = csv_dir / 'profiles.csv'
    if profiles_path.exists():
        with open(profiles_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            valid_user_types = {'student', 'university', 'recruiter', 'admin'}
            invalid_types = set()
            
            for row in reader:
                if row.get('user_type') not in valid_user_types:
                    invalid_types.add(row.get('user_type'))
            
            if invalid_types:
                print(f"❌ profiles.csv: Invalid user_types found: {invalid_types}")
                print(f"   Valid types are: {valid_user_types}")
            else:
                print(f"✓ profiles.csv: All user_types are valid")
    
    # Check faculty.csv for profile_id references
    faculty_path = csv_dir / 'faculty.csv'
    profiles_path = csv_dir / 'profiles.csv'
    if faculty_path.exists() and profiles_path.exists():
        with open(profiles_path, 'r', encoding='utf-8') as f:
            profile_ids = {row['id'] for row in csv.DictReader(f)}
        
        with open(faculty_path, 'r', encoding='utf-8') as f:
            faculty_reader = csv.DictReader(f)
            invalid_refs = 0
            for row in faculty_reader:
                if row.get('profile_id') and row['profile_id'] not in profile_ids:
                    invalid_refs += 1
            
            if invalid_refs > 0:
                print(f"❌ faculty.csv: {invalid_refs} invalid profile_id references")
            else:
                print(f"✓ faculty.csv: All profile_id references are valid")
    
    print("="*70)
    print("\n✓ Validation complete!")
    print(f"\nNext steps:")
    print(f"1. Run sql/comprehensive-csv-policy-fix.sql in Supabase SQL Editor")
    print(f"2. Fix any ERROR issues in CSV files before importing")
    print(f"3. Review WARNING issues and fix if necessary")

if __name__ == "__main__":
    main()
