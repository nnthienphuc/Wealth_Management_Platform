BEGIN TRANSACTION;
GO

ALTER TABLE [Investors] ADD [IsAdmin] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260819034312_AddInvestorIsAdmin', N'8.0.25');
GO

COMMIT;
GO

