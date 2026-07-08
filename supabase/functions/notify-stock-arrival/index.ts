import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface NotifyStockRequest {
  productId: string;
  productName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Confirm caller is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { productId, productName } = (await req.json()) as NotifyStockRequest;
    if (!productId) {
      return new Response(JSON.stringify({ error: "Missing productId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let name = productName;
    if (!name) {
      const { data: prod } = await supabase
        .from("products")
        .select("name")
        .eq("id", productId)
        .single();
      name = prod?.name || "a product";
    }

    // Find every customer who has ever ordered this product via customer_product_interest.
    const { data: interests } = await supabase
      .from("customer_product_interest")
      .select("user_id")
      .eq("product_id", productId);

    if (!interests || interests.length === 0) {
      return new Response(
        JSON.stringify({ notified: 0, message: "No interested customers found." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rows = interests.map((i) => ({
      user_id: i.user_id,
      product_id: productId,
      title: "New stock available",
      body: `${name} is back in stock! Order again from the Catalog.`,
      type: "stock_arrival",
    }));

    const { error: insertErr } = await supabase
      .from("notifications")
      .insert(rows);

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ notified: rows.length, message: `Notified ${rows.length} customer(s).` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Notification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
