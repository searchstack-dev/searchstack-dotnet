using System.Collections.Generic;

namespace SearchStack.PublicApi;

// Webhook subscription-management models. Property names map to the wire via the snake_case policy
// (see Json.cs). Optional members are omitted when null.

public sealed class CreateWebhookSubscriptionRequest
{
    /// <summary>The account the subscription belongs to.</summary>
    public string AccountName { get; set; } = "";

    /// <summary>HTTPS URL the webhook will POST to.</summary>
    public string Url { get; set; } = "";

    /// <summary>Event types this subscription should receive.</summary>
    public List<string> Events { get; set; } = new();
}

public sealed class EditWebhookSubscriptionRequest
{
    /// <summary>HTTPS URL the webhook will POST to.</summary>
    public string Url { get; set; } = "";

    /// <summary>Event types this subscription should receive.</summary>
    public List<string> Events { get; set; } = new();
}

// WebhookSubscriptionResponse (no secret) already exists in Models/Account.cs (it is a member of
// AccountResponse) — reused here rather than redefined.

/// <summary>A webhook subscription including its signing secret (returned only at create/rotate).</summary>
public sealed class WebhookSubscriptionWithSecretResponse
{
    public string Id { get; set; } = "";
    public string AccountName { get; set; } = "";
    public string Url { get; set; } = "";
    public string Secret { get; set; } = "";
    public List<string> Events { get; set; } = new();
    public bool IsActive { get; set; }
    public bool IsSuspended { get; set; }
    public long CreatedOn { get; set; }
}

/// <summary>A display group of subscribable event types.</summary>
public sealed class WebhookEventGroupResponse
{
    public string Label { get; set; } = "";
    public List<WebhookEventOptionResponse> Options { get; set; } = new();
}

/// <summary>A single subscribable event type.</summary>
public sealed class WebhookEventOptionResponse
{
    public string Value { get; set; } = "";
    public string Label { get; set; } = "";
}
