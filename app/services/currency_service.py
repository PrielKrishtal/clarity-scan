import httpx
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class CurrencyConverter:
    def __init__(self):
        # Cache keyed by ISO codes: {"ILS": {"USD": 0.27}, "USD": {"ILS": 3.65}}
        self.cache = {}
        self.last_fetched = None
        self.api_url = "https://api.frankfurter.app/latest"

    async def get_exchange_rate(self, from_currency: str, to_currency: str = "ILS") -> float:
        """
        Returns the exchange rate between two ISO currency codes (e.g. "ILS", "USD").
        Results are cached for 24 hours.
        """
        if from_currency == to_currency:
            return 1.0

        now = datetime.now()

        # Cache hit: return stored rate if fetched within the last 24 hours
        if self.last_fetched is not None and (now - self.last_fetched) < timedelta(hours=24):
            if from_currency in self.cache and to_currency in self.cache[from_currency]:
                logger.debug("Cache hit: %s → %s", from_currency, to_currency)
                return self.cache[from_currency][to_currency]

        return await self._fetch_rates_from_api(from_currency, to_currency)

    async def _fetch_rates_from_api(self, from_currency: str, to_currency: str) -> float:
        """Fetch live exchange rate from Frankfurter API using ISO codes directly."""
        supported = {"ILS", "USD"}
        if from_currency not in supported or to_currency not in supported:
            logger.warning("Unsupported currency code: %s or %s", from_currency, to_currency)
            return 1.0

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_url}?from={from_currency}&to={to_currency}")
                response.raise_for_status()
                data = response.json()
                rate = data["rates"][to_currency]

                # Store in cache
                if from_currency not in self.cache:
                    self.cache[from_currency] = {}
                self.cache[from_currency][to_currency] = rate
                self.last_fetched = datetime.now()

                logger.info("Fetched exchange rate: 1 %s = %s %s", from_currency, rate, to_currency)
                return rate

        except Exception as e:
            logger.error("Exchange rate API failed: %s. Using fallback.", str(e))
            fallbacks = {
                ("USD", "ILS"): 3.65,
                ("ILS", "USD"): 0.27,
            }
            return fallbacks.get((from_currency, to_currency), 1.0)


# Singleton instance to be imported across the application
currency_converter = CurrencyConverter()