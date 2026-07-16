namespace Regenera.Operations.Core.Modules;

public static class KycModule
{
    public static OperationsModuleDescriptor Descriptor =>
        ModuleRegistry.Get(OperationsModuleId.Kyc);

    public static KycReviewQueue BuildQueue()
    {
        var items = new[]
        {
            new KycQueueItem("KYC-1001", "CLI-ABC001", "DOCUMENT_REVIEW", "HIGH", DateTimeOffset.UtcNow.AddHours(-2)),
            new KycQueueItem("KYC-1002", "CLI-XYZ002", "PEP_SCREENING", "MEDIUM", DateTimeOffset.UtcNow.AddHours(-5)),
            new KycQueueItem("KYC-1003", "CLI-DEF003", "LIVENESS_CHECK", "LOW", DateTimeOffset.UtcNow.AddDays(-1))
        };
        return new KycReviewQueue(items, items.Count(i => i.Priority == "HIGH"));
    }

    public static KycDecision Evaluate(string queueItemId, KycDecisionAction action, string reviewerId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(queueItemId);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewerId);

        if (!queueItemId.StartsWith("KYC-", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Invalid KYC queue item id.", nameof(queueItemId));
        }

        return new KycDecision(
            queueItemId,
            action,
            reviewerId,
            DateTimeOffset.UtcNow,
            action == KycDecisionAction.Approve ? "APPROVED" : "REJECTED");
    }
}

public enum KycDecisionAction
{
    Approve,
    Reject,
    Escalate
}

public sealed record KycQueueItem(
    string QueueItemId,
    string ClientId,
    string Stage,
    string Priority,
    DateTimeOffset OpenedAt);

public sealed record KycReviewQueue(IReadOnlyList<KycQueueItem> Items, int HighPriorityCount);

public sealed record KycDecision(
    string QueueItemId,
    KycDecisionAction Action,
    string ReviewerId,
    DateTimeOffset DecidedAt,
    string Outcome);