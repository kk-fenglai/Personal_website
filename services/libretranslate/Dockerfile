FROM libretranslate/libretranslate:latest

ENV LT_HOST=0.0.0.0
ENV LT_LOAD_ONLY=zh,en,fr
ENV LT_UPDATE_MODELS=true
ENV LT_API_KEYS=true

COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
