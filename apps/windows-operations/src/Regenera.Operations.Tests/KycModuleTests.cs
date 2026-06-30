using Regenera.Operations.Core.Modules;

namespace Regenera.Operations.Tests;

public class KycModuleTests
{
    [Fact]
    public void BuildQueue_ContainsHighPriorityItems()
    {
        var queue = KycModule.BuildQueue();
        Assert.NotEmpty(queue.Items);
        Assert.True(queue.HighPriorityCount >= 1);
    }

    [Theory]
    [InlineData(KycDecisionAction.Approve, "APPROVED")]
    [InlineData(KycDecisionAction.Reject, "REJECTED")]
    public void Evaluate_ReturnsOutcome(KycDecisionAction action, string expected)
    {
        var decision = KycModule.Evaluate("KYC-1001", action, "reviewer-01");
        Assert.Equal(expected, decision.Outcome);
        Assert.Equal("reviewer-01", decision.ReviewerId);
    }

    [Fact]
    public void Evaluate_RejectsInvalidQueueId()
    {
        Assert.Throws<ArgumentException>(() =>
            KycModule.Evaluate("INVALID", KycDecisionAction.Approve, "reviewer-01"));
    }
}