from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str

    openai_api_key: str | None = None
    openai_transcribe_model: str = "whisper-1"
    openai_generation_model: str = "gpt-4o"
    openai_fast_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    deepgram_api_key: str | None = None
    deepgram_model: str = "nova-3"

    resend_api_key: str | None = None
    resend_from_email: str | None = None
    notify_email: str = "info@vokal.work"

    redis_url: str | None = None
    pinecone_api_key: str | None = None
    pinecone_index: str | None = None

    cron_secret: str | None = None

    weekly_insights_enabled: bool = True
    weekly_insights_day: str = "mon"  # mon,tue,... or mon-fri
    weekly_insights_hour: int = 9  # UTC

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:5500,https://vokal.work,https://www.vokal.work"
    port: int = 3001

    app_frontend_url: str = "https://vokal.work"
    credentials_encryption_key: str | None = None

    google_client_id: str | None = None
    google_client_secret: str | None = None
    google_redirect_uri: str | None = None

    notion_client_id: str | None = None
    notion_client_secret: str | None = None
    notion_redirect_uri: str | None = None
    notion_api_version: str = "2022-06-28"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
