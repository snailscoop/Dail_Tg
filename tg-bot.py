#!/usr/bin/env python3
import os
import sys
import json
import logging
import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Bot configuration
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "6974236136:AAF3TK1bNqAwBm3Ys1fBgBHiN_-d4-ajzNw")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
ADMIN_IDS = [int(id) for id in os.environ.get("ADMIN_IDS", "1234567890").split(",")]

# Helper functions
def is_admin(user_id):
    return user_id in ADMIN_IDS

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /help is issued."""
    help_text = """
Hello! Here are the commands you can use:
/help - Get help with using the bot
/search [query] - Search for an object
/snails - Get a random snail fact
/socials - Get our social media links
/link - Connect your Telegram account with a DID
/issue_credential - Issue a verifiable credential (admin only)
/verify - Verify a credential
/consent - Manage consent for moderation actions (admin only)
/poll - Create a poll (admin only)
"""
    await update.message.reply_text(help_text)

async def search_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Search for an object."""
    query = " ".join(context.args) if context.args else ""
    if not query:
        await update.message.reply_text("Please provide a search query.")
        return
    
    await update.message.reply_text(f"Searching for: {query}")
    # In a real implementation, you would call your search API here

async def snails_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Get a random snail fact."""
    snail_facts = [
        "Some snails have up to 20,000 teeth!",
        "Snails can sleep for up to three years.",
        "The fastest snails can move at a speed of 0.03 mph.",
        "Garden snails are hermaphrodites, having both male and female reproductive organs.",
        "The slime produced by snails can absorb water up to 1,000 times its original weight."
    ]
    import random
    fact = random.choice(snail_facts)
    await update.message.reply_text(f"🐌 Snail Fact: {fact}")

async def socials_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Get social media links."""
    socials = """
Our Social Media:
- Twitter: https://twitter.com/example
- Discord: https://discord.gg/example
- Website: https://example.com
"""
    await update.message.reply_text(socials)

async def link_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Connect Telegram account with a DID."""
    if not context.args:
        # Generate a new linking code
        try:
            response = requests.post(f"{BACKEND_URL}/generate_linking_code")
            data = response.json()
            
            if data["status"] == "success":
                code = data["data"]["code"]
                expires_at = data["data"]["expiresAt"]
                await update.message.reply_text(
                    f"To link your Telegram account with a DID, please use the following code in the web interface:\n\n"
                    f"Code: {code}\n\n"
                    f"This code will expire in 10 minutes."
                )
            else:
                await update.message.reply_text(f"Error generating linking code: {data['message']}")
        except Exception as e:
            logger.error(f"Error generating linking code: {str(e)}")
            await update.message.reply_text("Error generating linking code. Please try again later.")
    else:
        # Verify an existing code
        code = context.args[0]
        telegram_id = str(update.effective_user.id)
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/verify_linking_code",
                json={"code": code, "telegramId": telegram_id}
            )
            data = response.json()
            
            if data["status"] == "success":
                await update.message.reply_text(
                    f"✅ Account successfully linked!\n\n"
                    f"Your DID: {data['data']['did']}\n\n"
                    f"You can now use this DID for credential verification."
                )
            else:
                await update.message.reply_text(f"❌ Error verifying code: {data['message']}")
        except Exception as e:
            logger.error(f"Error verifying linking code: {str(e)}")
            await update.message.reply_text("Error verifying linking code. Please try again later.")

async def issue_credential_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Issue a verifiable credential (admin only)."""
    user_id = update.effective_user.id
    if not is_admin(user_id):
        await update.message.reply_text("Sorry, only admins can issue credentials.")
        return
    
    # In a full implementation, you would parse arguments and call your credential issuance endpoint
    await update.message.reply_text(
        "To issue a credential, please use the following format:\n"
        "/issue_credential <subject_did> <credential_type>\n"
        "For example:\n"
        "/issue_credential did:cheqd:testnet:abcdef123456 ModeratorCredential"
    )

async def verify_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Verify a credential."""
    if not context.args:
        await update.message.reply_text(
            "Please provide a credential to verify.\n"
            "For example:\n"
            "/verify eyJhbGciOiJFZERTQS..."
        )
        return
    
    credential = context.args[0]
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/tg_verify_credential",
            json={"credential": credential}
        )
        data = response.json()
        
        if data["status"] == "success" and data.get("verified", False):
            await update.message.reply_text(
                "✅ Credential verified!\n"
                f"Issuer: {data['data'].get('issuer', 'Unknown')}\n"
                f"Subject: {data['data'].get('subject', 'Unknown')}\n"
                f"Issuance Date: {data['data'].get('issuanceDate', 'Unknown')}"
            )
        else:
            await update.message.reply_text("❌ Invalid credential.")
    except Exception as e:
        logger.error(f"Error verifying credential: {str(e)}")
        await update.message.reply_text("Error verifying credential. Please try again later.")

async def consent_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Manage consent for moderation actions (admin only)."""
    user_id = update.effective_user.id
    if not is_admin(user_id):
        await update.message.reply_text("Sorry, only admins can manage consent.")
        return
    
    if not context.args:
        await update.message.reply_text(
            "Please specify an action and a subject.\n"
            "For example:\n"
            "/consent ban @username"
        )
        return
    
    action = context.args[0]
    subject = context.args[1] if len(context.args) > 1 else None
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/tg_record_consent",
            json={
                "telegramId": str(user_id),
                "action": action,
                "subject": subject,
                "approved": True
            }
        )
        data = response.json()
        
        if data["status"] == "success":
            await update.message.reply_text(
                f"Consent recorded for action: {action} on subject: {subject}"
            )
        else:
            await update.message.reply_text(f"Error recording consent: {data['message']}")
    except Exception as e:
        logger.error(f"Error recording consent: {str(e)}")
        await update.message.reply_text("Error recording consent. Please try again later.")

async def poll_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Create a poll (admin only)."""
    user_id = update.effective_user.id
    if not is_admin(user_id):
        await update.message.reply_text("Sorry, only admins can create polls.")
        return
    
    if not context.args:
        await update.message.reply_text(
            "Please provide a question for the poll.\n"
            "For example:\n"
            "/poll What is your favorite color? Blue Green Red Yellow"
        )
        return
    
    question = context.args[0]
    options = context.args[1:] if len(context.args) > 1 else ["Yes", "No"]
    
    await update.message.reply_poll(question=question, options=options)

def main() -> None:
    """Start the bot."""
    # Create the Application and pass it your bot's token.
    application = Application.builder().token(BOT_TOKEN).build()

    # Register command handlers
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("search", search_command))
    application.add_handler(CommandHandler("snails", snails_command))
    application.add_handler(CommandHandler("socials", socials_command))
    application.add_handler(CommandHandler("link", link_command))
    application.add_handler(CommandHandler("issue_credential", issue_credential_command))
    application.add_handler(CommandHandler("verify", verify_command))
    application.add_handler(CommandHandler("consent", consent_command))
    application.add_handler(CommandHandler("poll", poll_command))

    # Run the bot until the user presses Ctrl-C
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main() 