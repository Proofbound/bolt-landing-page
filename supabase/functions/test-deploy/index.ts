// TEST DEPLOYMENT FUNCTION - UNIQUE IDENTIFIER: 12345-ABCDE-TEST
// Created at: 2025-06-26 14:51
// This is a test function to verify deployment is working correctly

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const response = {
    message: "TEST DEPLOYMENT SUCCESS",
    timestamp: new Date().toISOString(),
    identifier: "12345-ABCDE-TEST",
    file_lines: 25,
    deployment_test: true
  };

  return new Response(
    JSON.stringify(response),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
});