import asyncio
import os
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from google import genai

# 1. Cấu hình Logging để theo dõi lỗi trên Cloud sau này
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# 2. Tải các biến môi trường từ file .env
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 3. Khởi tạo Gemini Client từ SDK mới (google-genai)
ai_client = genai.Client(api_key=GEMINI_API_KEY)


# 4. Xử lý lệnh /start
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_name = update.effective_user.first_name
    welcome_text = (
        f"Xin chào {user_name}! 👋\n"
        "Tôi là Trợ lý Cá nhân của bạn. Hiện tại tôi đã kết nối thành công với "
        "Gemini AI. Hãy nhắn bất cứ điều gì, tôi sẽ trả lời bạn ngay!"
    )
    await update.message.reply_text(welcome_text)


# 5. Xử lý tin nhắn văn bản từ User và gọi Gemini AI
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_message = update.message.text

    # Gửi trạng thái "typing..." để trải nghiệm người dùng mượt mà hơn
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")

    try:
        # Gọi mô hình gemini-2.5-flash (tối ưu tốc độ và miễn phí)
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_message,
        )

        # Phản hồi lại cho người dùng trên Telegram
        await update.message.reply_text(response.text, parse_mode="Markdown")

    except Exception as e:
        logger.error(f"Lỗi khi gọi Gemini API: {e}")
        await update.message.reply_text("Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau!")


# 6. Hàm main để khởi chạy ứng dụng
async def main():
    if not TELEGRAM_BOT_TOKEN or not GEMINI_API_KEY:
        logger.error("Thiếu TELEGRAM_BOT_TOKEN hoặc GEMINI_API_KEY trong file .env!")
        return

    # Khởi tạo Telegram Application
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Đăng ký các bộ xử lý sự kiện (Handlers)
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Khởi tạo và chạy bot trong cấu trúc Async chuẩn chỉnh
    async with application:
        await application.initialize()
        await application.start()

        logger.info("Bot đang chạy ở chế độ Polling...")
        await application.updater.start_polling()

        # Giữ cho bot chạy vô hạn cho đến khi bạn bấm Ctrl+C
        try:
            while True:
                await asyncio.sleep(3600)
        except (KeyboardInterrupt, SystemExit):
            logger.info("Đang dừng bot...")
            await application.updater.stop()
            await application.stop()
            await application.shutdown()


if __name__ == '__main__':
    # Thay vì gọi main() trực tiếp, ta dùng asyncio.run để tạo Event Loop chuẩn cho Python 3.14
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bot đã dừng hẳn.")