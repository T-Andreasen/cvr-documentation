# CVR API Implementation Guide

## Overview

This guide provides production-ready code examples for integrating with the Danish CVR Registry API. The examples include proper error handling, authentication, rate limiting, and performance optimization.

## API Configuration

### Authentication
- **Username**: `YOUR_CVR_USERNAME`
- **Password**: `YOUR_CVR_PASSWORD`
- **Base URL**: `http://distribution.virk.dk/cvr-permanent`
- **Authentication Type**: HTTP Basic Authentication

### Rate Limiting
- No documented rate limits, but implement reasonable delays
- Recommended: 2-5 requests per second maximum
- Use exponential backoff for retries

## Python Implementation

### Complete CVR Client Class

```python
import requests
import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

@dataclass
class CVRConfig:
    username: str = field(default_factory=lambda: os.getenv('CVR_USERNAME', ''))
    password: str = field(default_factory=lambda: os.getenv('CVR_PASSWORD', ''))
    base_url: str = "http://distribution.virk.dk/cvr-permanent"
    timeout: int = 30
    max_retries: int = 3
    backoff_factor: float = 0.3
    rate_limit_delay: float = 0.2

class CVRError(Exception):
    """Base exception for CVR API errors"""
    pass

class CVRAuthenticationError(CVRError):
    """Authentication failed"""
    pass

class CVRResultWindowError(CVRError):
    """Result window too large (>3000 records)"""
    pass

class CVRTimeoutError(CVRError):
    """Request timed out"""
    pass

class CVRClient:
    def __init__(self, config: CVRConfig = None):
        self.config = config or CVRConfig()
        self.session = self._create_session()
        self.logger = logging.getLogger(__name__)
        
    def _create_session(self) -> requests.Session:
        """Create HTTP session with retries and connection pooling"""
        session = requests.Session()
        session.auth = (self.config.username, self.config.password)
        
        # Configure retries
        retry_strategy = Retry(
            total=self.config.max_retries,
            backoff_factor=self.config.backoff_factor,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy, pool_maxsize=10)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session

    def _make_request(self, endpoint: str, query: Dict[str, Any]) -> Dict[str, Any]:
        """Make API request with error handling"""
        url = f"{self.config.base_url}/{endpoint}/_search"
        headers = {'Content-Type': 'application/json'}
        
        try:
            # Rate limiting
            time.sleep(self.config.rate_limit_delay)
            
            response = self.session.post(
                url, 
                json=query, 
                headers=headers, 
                timeout=self.config.timeout
            )
            
            # Handle authentication errors
            if response.status_code == 401:
                raise CVRAuthenticationError("Invalid credentials")
            
            # Handle result window errors
            if response.status_code == 500:
                error_data = response.json()
                if "Result window is too large" in str(error_data):
                    raise CVRResultWindowError("Query exceeds 3000 result limit. Use scroll API.")
                raise CVRError(f"Server error: {error_data}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.Timeout:
            raise CVRTimeoutError("Request timed out")
        except requests.exceptions.ConnectionError as e:
            raise CVRError(f"Connection error: {e}")
        except requests.exceptions.RequestException as e:
            raise CVRError(f"Request error: {e}")

    def search_companies(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Search companies (virksomhed) index"""
        return self._make_request("virksomhed", query)
    
    def search_participants(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Search participants (deltager) index"""
        return self._make_request("deltager", query)
    
    def search_production_units(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Search production units (produktionsenhed) index"""
        return self._make_request("produktionsenhed", query)

    def get_company_by_cvr(self, cvr_number: str) -> Optional[Dict[str, Any]]:
        """Get company by CVR number"""
        query = {
            "query": {
                "term": {
                    "Vrvirksomhed.cvrNummer": str(cvr_number)
                }
            }
        }
        
        result = self.search_companies(query)
        hits = result.get("hits", {}).get("hits", [])
        return hits[0]["_source"] if hits else None

    def search_companies_by_name(self, name: str, size: int = 10) -> List[Dict[str, Any]]:
        """Search companies by name with fuzzy matching"""
        query = {
            "query": {
                "bool": {
                    "should": [
                        {
                            "match": {
                                "Vrvirksomhed.navne.navn": {
                                    "query": name,
                                    "fuzziness": "AUTO"
                                }
                            }
                        },
                        {
                            "wildcard": {
                                "Vrvirksomhed.navne.navn": f"*{name.upper()}*"
                            }
                        }
                    ]
                }
            },
            "_source": [
                "Vrvirksomhed.cvrNummer", 
                "Vrvirksomhed.navne", 
                "Vrvirksomhed.virksomhedsstatus"
            ],
            "size": size
        }
        
        result = self.search_companies(query)
        return [hit["_source"] for hit in result.get("hits", {}).get("hits", [])]

    def get_active_companies_by_industry(self, industry_code: str, size: int = 100) -> List[Dict[str, Any]]:
        """Get active companies by industry code"""
        query = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "term": {
                                "Vrvirksomhed.hovedbranche.branchekode": industry_code
                            }
                        },
                        {
                            "term": {
                                "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
                            }
                        }
                    ]
                }
            },
            "size": size
        }
        
        result = self.search_companies(query)
        return [hit["_source"] for hit in result.get("hits", {}).get("hits", [])]

    def scroll_all_companies(self, query: Dict[str, Any], scroll_time: str = "2m") -> List[Dict[str, Any]]:
        """Use scroll API to get all results from a query"""
        all_results = []
        
        # Initial scroll request
        scroll_query = {**query, "size": 100}
        url = f"{self.config.base_url}/virksomhed/_search?scroll={scroll_time}"
        
        try:
            response = self.session.post(url, json=scroll_query, headers={'Content-Type': 'application/json'})
            response.raise_for_status()
            data = response.json()
            
            scroll_id = data.get("_scroll_id")
            hits = data.get("hits", {}).get("hits", [])
            all_results.extend([hit["_source"] for hit in hits])
            
            # Continue scrolling
            while hits and scroll_id:
                scroll_query = {
                    "scroll": scroll_time,
                    "scroll_id": scroll_id
                }
                
                response = self.session.post(
                    f"{self.config.base_url}/_search/scroll",
                    json=scroll_query,
                    headers={'Content-Type': 'application/json'}
                )
                response.raise_for_status()
                data = response.json()
                
                scroll_id = data.get("_scroll_id")
                hits = data.get("hits", {}).get("hits", [])
                all_results.extend([hit["_source"] for hit in hits])
                
                self.logger.info(f"Scrolled {len(all_results)} results so far...")
                
        except Exception as e:
            self.logger.error(f"Scroll error: {e}")
            raise
            
        return all_results

# Usage Example
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    client = CVRClient()
    
    try:
        # Search by CVR number
        company = client.get_company_by_cvr("10103940")
        print(f"Found company: {company['Vrvirksomhed']['navne'][0]['navn']}")
        
        # Search by name
        companies = client.search_companies_by_name("Novo Nordisk")
        print(f"Found {len(companies)} companies matching 'Novo Nordisk'")
        
        # Get companies in IT industry
        it_companies = client.get_active_companies_by_industry("620100")
        print(f"Found {len(it_companies)} active IT companies")
        
    except CVRError as e:
        print(f"CVR API error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")
```

## JavaScript/Node.js Implementation

```javascript
const axios = require('axios');
const axiosRetry = require('axios-retry');

class CVRClient {
    constructor(options = {}) {
        this.config = {
            username: process.env.CVR_USERNAME,
            password: process.env.CVR_PASSWORD,
            baseURL: 'http://distribution.virk.dk/cvr-permanent',
            timeout: 30000,
            maxRetries: 3,
            rateLimitDelay: 200,
            ...options
        };
        
        this.client = axios.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            auth: {
                username: this.config.username,
                password: this.config.password
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Configure retries
        axiosRetry(this.client, {
            retries: this.config.maxRetries,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error) => {
                return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
                       error.response?.status >= 500;
            }
        });
        
        this.lastRequestTime = 0;
    }
    
    async _makeRequest(endpoint, query) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.config.rateLimitDelay) {
            await this._sleep(this.config.rateLimitDelay - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();
        
        try {
            const response = await this.client.post(`/${endpoint}/_search`, query);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Authentication failed');
            }
            if (error.response?.status === 500) {
                const errorData = error.response.data;
                if (errorData.error?.reason?.includes('Result window is too large')) {
                    throw new Error('Query exceeds 3000 result limit. Use scroll API.');
                }
            }
            throw new Error(`API request failed: ${error.message}`);
        }
    }
    
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async searchCompanies(query) {
        return this._makeRequest('virksomhed', query);
    }
    
    async searchParticipants(query) {
        return this._makeRequest('deltager', query);
    }
    
    async searchProductionUnits(query) {
        return this._makeRequest('produktionsenhed', query);
    }
    
    async getCompanyByCVR(cvrNumber) {
        const query = {
            query: {
                term: {
                    'Vrvirksomhed.cvrNummer': String(cvrNumber)
                }
            }
        };
        
        const result = await this.searchCompanies(query);
        const hits = result.hits?.hits || [];
        return hits.length > 0 ? hits[0]._source : null;
    }
    
    async searchCompaniesByName(name, size = 10) {
        const query = {
            query: {
                bool: {
                    should: [
                        {
                            match: {
                                'Vrvirksomhed.navne.navn': {
                                    query: name,
                                    fuzziness: 'AUTO'
                                }
                            }
                        },
                        {
                            wildcard: {
                                'Vrvirksomhed.navne.navn': `*${name.toUpperCase()}*`
                            }
                        }
                    ]
                }
            },
            _source: [
                'Vrvirksomhed.cvrNummer',
                'Vrvirksomhed.navne',
                'Vrvirksomhed.virksomhedsstatus'
            ],
            size: size
        };
        
        const result = await this.searchCompanies(query);
        return (result.hits?.hits || []).map(hit => hit._source);
    }
}

// Usage example
async function example() {
    const client = new CVRClient();
    
    try {
        // Search by CVR number
        const company = await client.getCompanyByCVR('10103940');
        console.log('Found company:', company?.Vrvirksomhed?.navne?.[0]?.navn);
        
        // Search by name
        const companies = await client.searchCompaniesByName('Novo Nordisk');
        console.log(`Found ${companies.length} companies matching 'Novo Nordisk'`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

module.exports = CVRClient;
```

## cURL/Bash Implementation

```bash
#!/bin/bash

# CVR API Bash Client
# Configuration - Set these environment variables
CVR_USERNAME="${CVR_USERNAME:-}"
CVR_PASSWORD="${CVR_PASSWORD:-}"
CVR_BASE_URL="http://distribution.virk.dk/cvr-permanent"

# Check if credentials are set
if [[ -z "$CVR_USERNAME" || -z "$CVR_PASSWORD" ]]; then
    error "CVR_USERNAME and CVR_PASSWORD environment variables must be set"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Make API request with error handling
cvr_request() {
    local endpoint="$1"
    local query="$2"
    local output_file="$3"
    
    log "Making request to $endpoint"
    
    local response=$(curl -s -w "\n%{http_code}" \
        -u "${CVR_USERNAME}:${CVR_PASSWORD}" \
        -X POST "${CVR_BASE_URL}/${endpoint}/_search" \
        -H 'Content-Type: application/json' \
        -d "$query")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    case $http_code in
        200)
            log "Request successful"
            if [[ -n "$output_file" ]]; then
                echo "$body" | python3 -m json.tool > "$output_file"
                log "Response saved to $output_file"
            else
                echo "$body" | python3 -m json.tool
            fi
            return 0
            ;;
        401)
            error "Authentication failed. Check credentials."
            return 1
            ;;
        500)
            if echo "$body" | grep -q "Result window is too large"; then
                error "Query exceeds 3000 result limit. Use scroll API."
            else
                error "Server error: $body"
            fi
            return 1
            ;;
        *)
            error "HTTP $http_code: $body"
            return 1
            ;;
    esac
}

# Search company by CVR number
search_by_cvr() {
    local cvr_number="$1"
    local query="{\"query\": {\"term\": {\"Vrvirksomhed.cvrNummer\": \"$cvr_number\"}}}"
    cvr_request "virksomhed" "$query"
}

# Search companies by name
search_by_name() {
    local name="$1"
    local size="${2:-10}"
    local query="{
        \"query\": {
            \"match\": {
                \"Vrvirksomhed.navne.navn\": \"$name\"
            }
        },
        \"_source\": [\"Vrvirksomhed.cvrNummer\", \"Vrvirksomhed.navne\"],
        \"size\": $size
    }"
    cvr_request "virksomhed" "$query"
}

# Get companies by status
search_by_status() {
    local status="$1"
    local size="${2:-100}"
    local query="{
        \"query\": {
            \"term\": {
                \"Vrvirksomhed.virksomhedsstatus.status\": \"$status\"
            }
        },
        \"size\": $size
    }"
    cvr_request "virksomhed" "$query"
}

# Usage help
usage() {
    echo "Usage: $0 [COMMAND] [ARGS...]"
    echo ""
    echo "Commands:"
    echo "  cvr CVR_NUMBER           Search by CVR number"
    echo "  name COMPANY_NAME [SIZE] Search by company name"
    echo "  status STATUS [SIZE]     Search by company status"
    echo "  help                     Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 cvr 10103940"
    echo "  $0 name 'Novo Nordisk' 5"
    echo "  $0 status NORMAL 20"
}

# Main command dispatcher
main() {
    case "${1:-}" in
        cvr)
            if [[ -z "$2" ]]; then
                error "CVR number required"
                usage
                exit 1
            fi
            search_by_cvr "$2"
            ;;
        name)
            if [[ -z "$2" ]]; then
                error "Company name required"
                usage
                exit 1
            fi
            search_by_name "$2" "$3"
            ;;
        status)
            if [[ -z "$2" ]]; then
                error "Status required"
                usage
                exit 1
            fi
            search_by_status "$2" "$3"
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            error "Invalid command: ${1:-}"
            usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
```

## Production Best Practices

### 1. Error Handling Strategy

```python
# Comprehensive error handling
try:
    result = client.search_companies(query)
except CVRResultWindowError:
    # Use scroll API for large results
    result = client.scroll_all_companies(query)
except CVRAuthenticationError:
    # Refresh credentials or alert ops team
    logger.critical("Authentication failed - check credentials")
    raise
except CVRTimeoutError:
    # Retry with exponential backoff
    logger.warning("Request timed out - retrying")
    # Implement retry logic
except CVRError as e:
    # Log and handle gracefully
    logger.error(f"CVR API error: {e}")
    # Return cached data or default response
```

### 2. Rate Limiting Implementation

```python
import time
from collections import deque
from threading import Lock

class RateLimiter:
    def __init__(self, max_requests=5, time_window=1.0):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()
        self.lock = Lock()
    
    def acquire(self):
        with self.lock:
            now = time.time()
            
            # Remove old requests outside the time window
            while self.requests and self.requests[0] <= now - self.time_window:
                self.requests.popleft()
            
            # Check if we can make a request
            if len(self.requests) < self.max_requests:
                self.requests.append(now)
                return True
            
            # Wait until we can make a request
            sleep_time = self.requests[0] + self.time_window - now
            if sleep_time > 0:
                time.sleep(sleep_time)
                return self.acquire()
            
            return True
```

### 3. Caching Strategy

```python
import redis
import json
from datetime import timedelta

class CVRCache:
    def __init__(self, redis_client=None):
        self.redis = redis_client or redis.Redis(
            host='localhost', 
            port=6379, 
            decode_responses=True
        )
        self.default_ttl = 3600  # 1 hour
    
    def get(self, key):
        try:
            data = self.redis.get(key)
            return json.loads(data) if data else None
        except (redis.RedisError, json.JSONDecodeError):
            return None
    
    def set(self, key, value, ttl=None):
        try:
            self.redis.setex(
                key, 
                ttl or self.default_ttl, 
                json.dumps(value, ensure_ascii=False)
            )
        except redis.RedisError:
            pass  # Continue without caching
    
    def get_or_fetch(self, key, fetch_func, ttl=None):
        # Try cache first
        cached = self.get(key)
        if cached:
            return cached
        
        # Fetch from API
        result = fetch_func()
        
        # Cache the result
        self.set(key, result, ttl)
        return result
```

### 4. Monitoring and Logging

```python
import structlog
from prometheus_client import Counter, Histogram, Gauge
import time

# Metrics
REQUEST_COUNT = Counter('cvr_api_requests_total', 'Total CVR API requests', ['endpoint', 'status'])
REQUEST_DURATION = Histogram('cvr_api_request_duration_seconds', 'CVR API request duration')
ACTIVE_CONNECTIONS = Gauge('cvr_api_active_connections', 'Active CVR API connections')

logger = structlog.get_logger()

class MonitoredCVRClient(CVRClient):
    def _make_request(self, endpoint: str, query: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        ACTIVE_CONNECTIONS.inc()
        
        try:
            result = super()._make_request(endpoint, query)
            REQUEST_COUNT.labels(endpoint=endpoint, status='success').inc()
            return result
            
        except Exception as e:
            REQUEST_COUNT.labels(endpoint=endpoint, status='error').inc()
            logger.error(
                "CVR API request failed",
                endpoint=endpoint,
                query_size=len(json.dumps(query)),
                error=str(e)
            )
            raise
            
        finally:
            duration = time.time() - start_time
            REQUEST_DURATION.observe(duration)
            ACTIVE_CONNECTIONS.dec()
            
            logger.info(
                "CVR API request completed",
                endpoint=endpoint,
                duration=duration,
                query_size=len(json.dumps(query))
            )
```

### 5. Configuration Management

```python
import os
from dataclasses import dataclass, field
from typing import Dict, Any
import yaml

@dataclass
class CVRConfig:
    # API Configuration
    username: str = field(default_factory=lambda: os.getenv('CVR_USERNAME', ''))
    password: str = field(default_factory=lambda: os.getenv('CVR_PASSWORD', ''))
    base_url: str = field(default_factory=lambda: os.getenv('CVR_BASE_URL', 'http://distribution.virk.dk/cvr-permanent'))
    
    # Connection Settings
    timeout: int = field(default_factory=lambda: int(os.getenv('CVR_TIMEOUT', '30')))
    max_retries: int = field(default_factory=lambda: int(os.getenv('CVR_MAX_RETRIES', '3')))
    rate_limit_delay: float = field(default_factory=lambda: float(os.getenv('CVR_RATE_LIMIT_DELAY', '0.2')))
    
    # Cache Settings
    cache_ttl: int = field(default_factory=lambda: int(os.getenv('CVR_CACHE_TTL', '3600')))
    redis_url: str = field(default_factory=lambda: os.getenv('REDIS_URL', 'redis://localhost:6379'))
    
    @classmethod
    def from_file(cls, config_path: str):
        """Load configuration from YAML file"""
        with open(config_path, 'r') as f:
            config_data = yaml.safe_load(f)
        return cls(**config_data.get('cvr', {}))
    
    def validate(self):
        """Validate configuration"""
        if not self.username or not self.password:
            raise ValueError("CVR username and password are required")
        
        if self.timeout <= 0:
            raise ValueError("Timeout must be positive")
        
        if self.rate_limit_delay < 0:
            raise ValueError("Rate limit delay cannot be negative")

# Example config.yaml
"""
cvr:
  username: "${CVR_USERNAME}"
  password: "${CVR_PASSWORD}"
  base_url: "http://distribution.virk.dk/cvr-permanent"
  timeout: 30
  max_retries: 3
  rate_limit_delay: 0.2
  cache_ttl: 3600
  redis_url: "redis://localhost:6379"
"""
```

## Testing Strategy

### Unit Tests

```python
import unittest
from unittest.mock import Mock, patch
import pytest
from cvr_client import CVRClient, CVRError, CVRResultWindowError

class TestCVRClient(unittest.TestCase):
    def setUp(self):
        self.client = CVRClient()
    
    @patch('requests.Session.post')
    def test_get_company_by_cvr_success(self, mock_post):
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "hits": {
                "hits": [
                    {
                        "_source": {
                            "Vrvirksomhed": {
                                "cvrNummer": 10103940,
                                "navne": [{"navn": "Statsministeriet"}]
                            }
                        }
                    }
                ]
            }
        }
        mock_post.return_value = mock_response
        
        result = self.client.get_company_by_cvr("10103940")
        
        self.assertIsNotNone(result)
        self.assertEqual(result["Vrvirksomhed"]["cvrNummer"], 10103940)
    
    @patch('requests.Session.post')
    def test_result_window_error(self, mock_post):
        # Mock result window error
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.json.return_value = {
            "error": {
                "reason": "Result window is too large"
            }
        }
        mock_post.return_value = mock_response
        
        with pytest.raises(CVRResultWindowError):
            self.client.search_companies({"from": 3001, "size": 1})
```

### Integration Tests

```python
import pytest
from cvr_client import CVRClient
import time

class TestCVRIntegration:
    @pytest.fixture
    def client(self):
        return CVRClient()
    
    def test_real_api_connection(self, client):
        """Test actual API connection"""
        result = client.get_company_by_cvr("10103940")
        assert result is not None
        assert result["Vrvirksomhed"]["cvrNummer"] == 10103940
    
    def test_rate_limiting(self, client):
        """Test rate limiting works"""
        start_time = time.time()
        
        # Make multiple requests
        for _ in range(3):
            client.get_company_by_cvr("10103940")
        
        elapsed = time.time() - start_time
        # Should take at least 0.4 seconds (2 * 0.2s delay)
        assert elapsed >= 0.4
    
    @pytest.mark.parametrize("cvr_number,expected_name", [
        ("10103940", "Statsministeriet"),
        ("10150817", "NOVO NORDISK A/S"),
    ])
    def test_known_companies(self, client, cvr_number, expected_name):
        """Test known companies return expected results"""
        result = client.get_company_by_cvr(cvr_number)
        assert result is not None
        names = [n["navn"] for n in result["Vrvirksomhed"]["navne"]]
        assert any(expected_name.upper() in name.upper() for name in names)
```

## Deployment Considerations

### Docker Configuration

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "from cvr_client import CVRClient; client = CVRClient(); client.get_company_by_cvr('10103940')"

CMD ["python", "main.py"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cvr-api-client
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cvr-api-client
  template:
    metadata:
      labels:
        app: cvr-api-client
    spec:
      containers:
      - name: cvr-api-client
        image: cvr-api-client:latest
        env:
        - name: CVR_USERNAME
          valueFrom:
            secretKeyRef:
              name: cvr-credentials
              key: username
        - name: CVR_PASSWORD
          valueFrom:
            secretKeyRef:
              name: cvr-credentials
              key: password
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

This implementation guide provides production-ready code examples with proper error handling, rate limiting, caching, monitoring, and deployment configurations for the CVR API.