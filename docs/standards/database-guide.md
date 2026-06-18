---
last_review_sha: c9755a563aa77380c1f6d14e585bc3940980eaed
---

# Database Guide

This stack-specific baseline captures the database intent for a SQL Server schema. Each change that touches database
objects should seek to conform those objects to this standard. Exceptions are allowed but should be called out.

## Table of Contents

## Naming

Naming database objects in a consistent way allows both AI and humans to reason about the system and avoid mistakes.

### Table Names

Table names are:

- singular not plural
- Pascal case
- Avoid word separaters like underscore and dash

Good:

- MyTable
- StillMyTable

Bad:

- MyTables - plural
- My_Table - uses a word seperator
- myTable - this is case case, not pascal

### Column Names

Column names are:

- singular not plural
- Pascal case
- Avoid word separaters like underscore and dash

Good:

- MyColumn
- StillMyColumn

Bad:

- MyColumns - plural
- My_Column - uses a word seperator

Exception:

- Primary keys use "ID" (both letters in caps) for their suffix.

#### Primary Keys

Primary key columns should always be named with the suffix "ID" (both capitalized). In all new cases this should be
proceeded by the tablename.

For the table InvoiceLine

Good:

- InvoiceLineID

Bad:

- InvoiceLine_ID - uses a separator
- InvoiceLineIDs - is plural

#### Foreign Key Columns

The foreign key should be identical to the primary key of the parent table.

For example if there is a table Invoice with a primary key of InvoiceID, then the child table InvoiceLine with a
foreign key from Invoice should be InvoiceLine.InvoiceID.

This makes columns ending in "ID" easy to recognize as primary or foreign keys.

### Indexes

#### Primary Keys

A brownfield database may inherit naming norms that should be preserved for consistency.

Primary keys are named with the table name in Pascal case and the suffix \_PK.

#### Unique Indexes - As Constraints

SQL Server distinguishes between a unique constraint and a unique index. This baseline uses unique constraints for
business uniqueness rules because creating the constraint also creates the supporting index.

Unique indexes are only created in very specific circumstances. (See below exception case)

Unique constraints are "unique keys" to the primary key and describe a business rule. The underlying index provides
performance enhancements to any query that includes the column(s) in a where clause.

All unique constraints are prefixed with "AK\_" followed by the table name and the column name(s) separated by an
underscore (\_) character.

Given the table InvoiceLine, with columns CustomerID, InvoiceID and ControlCode:

Good:

- AK_InvoiceLine_InvoiceID_ControlCode

Bad:

- AKInvoiceLineInvoiceIDControlCode - doesn't use underscore to separate objects
- AK_InvoiceLine - ambiguous; the SQL Server error does not reveal which column caused the problem.

Given a simpler case of `Location.LocationName` needing to be unique

Good:

- AK_Location_LocationName

Bad:

- AK_Location - ambiguous b/c it won't be easy to see which column is the problem

##### Unique Indexes as Exceptions to the rule

Long-lived databases may contain duplicate values where uniqueness should have existed. SQL Server cannot add a unique
constraint while duplicates remain, but a filtered unique index can enforce uniqueness for all non-duplicated values.

When uniqueness should be enforced but duplicate legacy values already exist, use the following pattern:

```sql
create unique index AK_Product_ProductName
on dbo.Product(ProductName)
where ProductName <> 'a'
  and ProductName <> 'CCB'
  and ProductName <> 'CRUDE'
  and ProductName <> 'TCS';
```

The where clause excludes the duplicates that already exist and allow for the following benefits:

- New duplicates cannot be created
  - except for the values in the list already
- A strategy of protecting data at the database level first is easier to implement.
  - Trapping DB errors immediately in stored procedures improves referential integrity and gives callers stable error
    contracts.

## Constraints

### Foreign Key Constraints

Foreign key constraints shall be named in the form `FK_ParentTable$ChildTable` to allow for any errors to be easily
traced to the entitities and relationships in the database.

Good:

- FK_Invoice$InvoiceLine

Bad:

- FK\_\_DataProvi\_\_LinkI\_\_1C873BEC - SQLServer default naming

At this time, bad fk constraint names should be surfaced to the developer and not changed automatically unless
explicitly directed to do so.

### Unique Constraint

See the section on Unique Indexes above. Create unique constraints for normal uniqueness rules; use unique indexes
only for the documented filtered-index exception.
