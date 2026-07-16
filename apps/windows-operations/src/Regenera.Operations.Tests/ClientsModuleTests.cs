using Regenera.Operations.Core.Modules;

namespace Regenera.Operations.Tests;

public class ClientsModuleTests
{
    [Fact]
    public void Descriptor_RequiresClientsReadPermission()
    {
        var descriptor = ClientsModule.Descriptor;
        Assert.Equal(OperationsModuleId.Clients, descriptor.Id);
        Assert.Equal("clients:read", descriptor.RequiredPermission);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Search_RejectsBlankQuery(string query)
    {
        Assert.Throws<ArgumentException>(() => ClientsModule.Search(query));
    }

    [Fact]
    public void Search_ReturnsValidationMessageForShortQuery()
    {
        var result = ClientsModule.Search("a");
        Assert.Empty(result.Items);
        Assert.NotNull(result.ValidationMessage);
    }

    [Fact]
    public void Search_ReturnsMatchesForValidQuery()
    {
        var result = ClientsModule.Search("Silva");
        Assert.Equal(2, result.Items.Count);
        Assert.All(result.Items, item => Assert.StartsWith("CLI-", item.ClientId));
    }
}