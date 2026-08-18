using System;

namespace SearchStack.PublicApi;

// Path-segment encoding, equivalent to the TS client's encodeURIComponent.
internal static class Url
{
    internal static string Enc(string value) => Uri.EscapeDataString(value ?? "");
}
