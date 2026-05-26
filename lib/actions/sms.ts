"use server";

import { createClient } from "../supabase/server";

const GREENWEB_API_URL = "http://api.greenweb.com.bd/api.php";

/**
 * Send an SMS using GreenWeb API
 */
export async function sendSMS(to: string, message: string) {
  try {
    const token = process.env.GREENWEB_API_TOKEN;
    if (!token) {
      console.warn("GREENWEB_API_TOKEN is not set. Skipping SMS.");
      return { success: false, error: "SMS configuration missing." };
    }

    const supabase = await createClient();

    // Rate Limiting: Max 10 SMS per minute globally to prevent abuse
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count } = await supabase
      .from("sms_logs")
      .select("*", { count: "exact", head: true })
      .gte("sent_at", oneMinuteAgo);
      
    if (count !== null && count >= 10) {
      console.warn("SMS rate limit exceeded.");
      return { success: false, error: "Rate limit exceeded. Try again in a minute." };
    }

    const response = await fetch(GREENWEB_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token,
        to,
        message,
      }),
    });

    const resultText = await response.text();
    // Typical greenweb success response contains "Ok"
    const success = resultText.toLowerCase().includes("ok") || response.ok;

    // Attempt to find customer id based on phone
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", to)
      .single();

    await supabase.from("sms_logs").insert({
      phone: to,
      message,
      status: success ? "success" : "failed",
      customer_id: customer?.id || null,
    });

    return { success, data: resultText };
  } catch (error: any) {
    console.error("SMS sending failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send order placed SMS
 */
export async function sendOrderPlacedSMS(orderId: string, phone: string, deliveryDate: Date) {
  const dateStr = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(deliveryDate));
  
  const shortId = orderId.split('-')[0].toUpperCase();
  const message = `আপনার অর্ডার #${shortId} গৃহীত হয়েছে। ডেলিভারি তারিখ: ${dateStr}। ধন্যবাদ, Swadhin Enterprise।`;
  
  return sendSMS(phone, message);
}

/**
 * Send order delivered SMS
 */
export async function sendDeliveredSMS(orderId: string, phone: string, totalAmount: number) {
  const shortId = orderId.split('-')[0].toUpperCase();
  const message = `আপনার অর্ডার #${shortId} ডেলিভারি সম্পন্ন হয়েছে। মোট: ৳${totalAmount}। ধন্যবাদ, Swadhin Enterprise।`;
  
  return sendSMS(phone, message);
}
