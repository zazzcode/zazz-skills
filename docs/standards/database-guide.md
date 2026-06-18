---
last_review_sha: c9755a563aa77380c1f6d14e585bc3940980eaed
---

# Database Guide

This guide is our _intent_. Each change that touches database objects should seek to conform those objects to this
standard. Exceptions are allowed but should be called out.

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

This allows a glance us to infer that a column of suffix "ID" is a foreign key.

### Indexes

#### Primary Keys

Being a brownfield database we are inheriting some norms.

Primary keys are named with the table name in Pascal case and the suffix \_PK.

#### Unique Indexes - As Constraints

SQL Server has a strange distinction between a unique constraint and a unique index. For this project the use of we
will only use unique contraints because their creation includes the creation of the index.

Unique indexes are only created in very specific circumstances. (See below exception case)

Unique contraints are "unique keys" to the primary key and describe a business rule. The underlying index provides
performance enhancements to any query that includes the column(s) in a where clause.

All unique index are prefixed with "AK\_" followed by the table name and the column name(s) separated by a an
underscore (\_) character.

Given the table InvoiceLine, with columns CustomerID, InvoiceID and ControlCode:

Good:

- AK_InvoiceLine_InvoiceID_ControlCode

Bad:

- AKInvoiceLineInvoiceIDControlCode - doesn't use underscore to separate objects
- AK_InvoiceLine - ambiguous so we cannot infer easily where the problem is from the error SQL Server gives us.

Given a simpler case of `Location.LocationName` needing to be unique

Good:

- AK_Location_LocationName

Bad:

- AK_Location - ambiguous b/c it won't be easy to see which column is the problem

##### Unique Indexes as Exceptions to the rule

Because we have 20+ years of data and unique constraints often did not exist, we have some duplicate data where it
should not be. SQL Server has no way to enforce constraints in this situation. However it does provide a way to do so
with a unique index.

In the even that uniqueness should be enforced but duplicates already exist we will use the following pattern

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
- Our strategy of protecting the data at the database level first is easier to implement
  - Our ability to trap DB errors immediately in SPROCs improves our referential integrity by an order of magnitude.

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

See the section on Unique Indexes above. We ONLY create unique constraints and never unique indexes.
