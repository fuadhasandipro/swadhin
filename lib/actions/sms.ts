"use server";

import { createClient } from "../supabase/server";

const BDBULKSMS_API_URL = "https://api.bdbulksms.net/api.php";
const BDBULKSMS_STATS_URL = "https://api.bdbulksms.net/g_api.php";

/**
 * Send an SMS using bdbulksms API
 */
export async function sendSMS(to: string, message: string) {
  try {
    const token = process.env.GREENWEB_API_TOKEN; // using same env var for token
    if (!token) {
      console.warn("API token is not set. Skipping SMS.");
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

    const response = await fetch(BDBULKSMS_API_URL, {
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
    // Usually bulk sms APIs return JSON or ok message. 
    // bdbulksms returns success/error in JSON if using ?json, but here we just check ok or status.
    // If it contains "Error" or something, success is false. Let's assume ok response means success for now.
    const success = response.ok && !resultText.toLowerCase().includes("error");

    // Attempt to find customer id based on phone
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", to)
      .single();

    await supabase.from("sms_logs").insert({
      phone: to,
      message,
      status: success ? "sent" : "failed",
      customer_id: customer?.id || null,
    });

    return { success, data: resultText };
  } catch (error: any) {
    console.error("SMS sending failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch SMS Account Stats from bdbulksms
 */
export async function getSMSAccountStats(token: string) {
  if (!token) throw new Error("No token provided");
  try {
    const url = `${BDBULKSMS_STATS_URL}?token=${token}&balance&expiry&rate&totalsms&json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch SMS stats");
    const data = await res.json();
    return data; // returns the json payload with stats
  } catch (err: any) {
    console.error(err);
    throw new Error("Could not retrieve SMS statistics");
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
  const message = `আপনার অর্ডার #${shortId} গৃহীত হয়েছে। ডেলিভারি তারিখ: ${dateStr}। ধন্যবাদ, Swadhin Enterprize।`;

  return sendSMS(phone, message);
}

/**
 * Send order delivered SMS
 */
export async function sendDeliveredSMS(orderId: string, phone: string, totalAmount: number) {
  const shortId = orderId.split('-')[0].toUpperCase();
  const message = `আপনার অর্ডার #${shortId} ডেলিভারি সম্পন্ন হয়েছে। মোট: ৳${totalAmount}। ধন্যবাদ, Swadhin Enterprize।`;

  return sendSMS(phone, message);
}

/**
 * Send payment reminder SMS
 */
export async function sendPaymentReminderSMS(phone: string, dueAmount: number, customerName: string) {
  const message = `[স্বাধীন এন্টারপ্রাইজ]\n ${customerName},\nআপনার বর্তমান বকেয়া: ${dueAmount} টাকা। অনুগ্রহ করে দ্রুত পরিশোধ করার অনুরোধ করা হলো।\nধন্যবাদ!`;
  return sendSMS(phone, message);
}
