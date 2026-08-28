BEGIN TRANSACTION;
GO

ALTER TABLE [Holdings] ADD [StopLoss] decimal(28,8) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260828031407_AddHoldingStopLoss', N'8.0.25');
GO

COMMIT;
GO

