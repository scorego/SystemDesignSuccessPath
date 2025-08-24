# Data Warehousing & Analytics

## Overview

Data warehousing involves collecting, storing, and analyzing large volumes of data from multiple sources to support business intelligence and analytics. Understanding OLTP vs OLAP systems, ETL processes, and modern data architectures is crucial for designing systems that handle both operational and analytical workloads.

## OLTP vs OLAP

### Online Transaction Processing (OLTP)

**Characteristics:**
- Optimized for frequent, short transactions
- High concurrency with many users
- Real-time data processing
- Normalized data structure
- ACID compliance critical

```sql
-- Typical OLTP operations
-- Insert new order
INSERT INTO orders (customer_id, product_id, quantity, price, order_date)
VALUES (12345, 67890, 2, 29.99, NOW());

-- Update inventory
UPDATE products 
SET stock_quantity = stock_quantity - 2 
WHERE product_id = 67890;

-- Quick customer lookup
SELECT customer_id, name, email 
FROM customers 
WHERE customer_id = 12345;
```

### Online Analytical Processing (OLAP)

**Characteristics:**
- Optimized for complex queries and aggregations
- Lower concurrency, analytical workloads
- Historical data analysis
- Denormalized/dimensional data structure
- Read-heavy operations

```sql
-- Typical OLAP operations
-- Sales analysis by region and time
SELECT 
    r.region_name,
    DATE_TRUNC('month', o.order_date) as month,
    SUM(oi.quantity * oi.price) as total_revenue,
    COUNT(DISTINCT o.customer_id) as unique_customers,
    AVG(oi.quantity * oi.price) as avg_order_value
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN customers c ON o.customer_id = c.customer_id
JOIN regions r ON c.region_id = r.region_id
WHERE o.order_date >= '2023-01-01'
GROUP BY r.region_name, DATE_TRUNC('month', o.order_date)
ORDER BY month, total_revenue DESC;

-- Product performance analysis
SELECT 
    p.category,
    p.product_name,
    SUM(oi.quantity) as total_sold,
    SUM(oi.quantity * oi.price) as revenue,
    COUNT(DISTINCT o.customer_id) as unique_buyers
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date BETWEEN '2023-01-01' AND '2023-12-31'
GROUP BY p.category, p.product_name
HAVING SUM(oi.quantity) > 100
ORDER BY revenue DESC;
```

### Comparison Table

| Aspect | OLTP | OLAP |
|--------|------|------|
| **Purpose** | Day-to-day operations | Business intelligence, reporting |
| **Data** | Current, operational | Historical, aggregated |
| **Queries** | Simple, fast | Complex, analytical |
| **Users** | Many concurrent users | Fewer analytical users |
| **Response Time** | Milliseconds | Seconds to minutes |
| **Data Volume** | Gigabytes to Terabytes | Terabytes to Petabytes |
| **Schema** | Normalized (3NF) | Denormalized (Star/Snowflake) |
| **Updates** | Frequent inserts/updates | Batch loads, infrequent updates |

## Data Warehouse Architecture

### Traditional Data Warehouse

```mermaid
graph TD
    A[Operational Systems] --> B[ETL Process]
    C[External Data Sources] --> B
    D[Files/APIs] --> B
    B --> E[Staging Area]
    E --> F[Data Warehouse]
    F --> G[Data Marts]
    F --> H[OLAP Cubes]
    G --> I[Reporting Tools]
    H --> I
    F --> J[Data Mining Tools]
```

### Modern Data Lake Architecture

```mermaid
graph TD
    A[Streaming Data] --> B[Data Lake]
    C[Batch Data] --> B
    D[APIs/Files] --> B
    B --> E[Raw Data Zone]
    E --> F[Processed Data Zone]
    F --> G[Curated Data Zone]
    G --> H[Data Warehouse]
    G --> I[Analytics Tools]
    G --> J[ML Platforms]
    B --> K[Real-time Analytics]
```

## ETL (Extract, Transform, Load)

### Extract Phase

**Database Extraction**
```python
import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime, timedelta

class DataExtractor:
    def __init__(self, source_connections):
        self.connections = source_connections
    
    def extract_orders(self, start_date, end_date):
        """Extract orders from operational database"""
        query = """
        SELECT 
            o.order_id,
            o.customer_id,
            o.order_date,
            o.status,
            oi.product_id,
            oi.quantity,
            oi.price,
            p.category,
            c.region_id
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        JOIN customers c ON o.customer_id = c.customer_id
        WHERE o.order_date BETWEEN %s AND %s
        """
        
        engine = create_engine(self.connections['oltp'])
        return pd.read_sql(query, engine, params=[start_date, end_date])
    
    def extract_customer_data(self):
        """Extract customer dimension data"""
        query = """
        SELECT 
            customer_id,
            name,
            email,
            registration_date,
            region_id,
            customer_segment
        FROM customers
        WHERE status = 'active'
        """
        
        engine = create_engine(self.connections['crm'])
        return pd.read_sql(query, engine)
    
    def extract_web_analytics(self, date):
        """Extract web analytics from files"""
        # Example: Reading from CSV files
        file_path = f"/data/web_analytics/{date.strftime('%Y-%m-%d')}.csv"
        return pd.read_csv(file_path)

# Usage
extractor = DataExtractor({
    'oltp': 'postgresql://user:pass@oltp-db:5432/ecommerce',
    'crm': 'postgresql://user:pass@crm-db:5432/customers'
})

yesterday = datetime.now() - timedelta(days=1)
orders_data = extractor.extract_orders(yesterday, yesterday)
```

### Transform Phase

**Data Cleaning and Transformation**
```python
import pandas as pd
import numpy as np
from datetime import datetime

class DataTransformer:
    def __init__(self):
        pass
    
    def clean_orders_data(self, df):
        """Clean and standardize orders data"""
        # Remove duplicates
        df = df.drop_duplicates(subset=['order_id', 'product_id'])
        
        # Handle missing values
        df['quantity'] = df['quantity'].fillna(1)
        df['price'] = df['price'].fillna(0)
        
        # Data type conversions
        df['order_date'] = pd.to_datetime(df['order_date'])
        df['quantity'] = df['quantity'].astype(int)
        df['price'] = df['price'].astype(float)
        
        # Calculate derived fields
        df['line_total'] = df['quantity'] * df['price']
        df['order_year'] = df['order_date'].dt.year
        df['order_month'] = df['order_date'].dt.month
        df['order_quarter'] = df['order_date'].dt.quarter
        
        return df
    
    def create_customer_dimension(self, df):
        """Transform customer data into dimension table format"""
        # Standardize customer segments
        segment_mapping = {
            'premium': 'Premium',
            'standard': 'Standard', 
            'basic': 'Basic',
            'vip': 'Premium'
        }
        df['customer_segment'] = df['customer_segment'].map(segment_mapping)
        
        # Create customer age groups
        df['registration_date'] = pd.to_datetime(df['registration_date'])
        df['days_since_registration'] = (datetime.now() - df['registration_date']).dt.days
        
        def categorize_customer_age(days):
            if days < 30:
                return 'New (< 1 month)'
            elif days < 365:
                return 'Recent (< 1 year)'
            elif days < 1095:
                return 'Established (1-3 years)'
            else:
                return 'Veteran (3+ years)'
        
        df['customer_age_group'] = df['days_since_registration'].apply(categorize_customer_age)
        
        return df
    
    def aggregate_daily_metrics(self, orders_df):
        """Create daily aggregated metrics"""
        daily_metrics = orders_df.groupby(['order_date', 'region_id']).agg({
            'order_id': 'nunique',  # unique orders
            'customer_id': 'nunique',  # unique customers
            'line_total': ['sum', 'mean'],  # total and average revenue
            'quantity': 'sum'  # total items sold
        }).reset_index()
        
        # Flatten column names
        daily_metrics.columns = [
            'order_date', 'region_id', 'total_orders', 'unique_customers',
            'total_revenue', 'avg_order_value', 'total_items_sold'
        ]
        
        return daily_metrics

# Usage
transformer = DataTransformer()
clean_orders = transformer.clean_orders_data(orders_data)
customer_dim = transformer.create_customer_dimension(customer_data)
daily_metrics = transformer.aggregate_daily_metrics(clean_orders)
```

### Load Phase

**Loading into Data Warehouse**
```python
from sqlalchemy import create_engine
import pandas as pd

class DataLoader:
    def __init__(self, warehouse_connection):
        self.engine = create_engine(warehouse_connection)
    
    def load_dimension_table(self, df, table_name, method='upsert'):
        """Load data into dimension table with SCD Type 2 support"""
        if method == 'upsert':
            # Implement slowly changing dimension logic
            self._upsert_dimension(df, table_name)
        else:
            # Simple append or replace
            df.to_sql(table_name, self.engine, if_exists=method, index=False)
    
    def _upsert_dimension(self, df, table_name):
        """Implement SCD Type 2 for dimension tables"""
        # This is a simplified version - production would be more complex
        with self.engine.begin() as conn:
            # Mark existing records as inactive
            conn.execute(f"""
                UPDATE {table_name} 
                SET is_current = FALSE, end_date = CURRENT_DATE
                WHERE customer_id IN ({','.join(map(str, df['customer_id'].tolist()))})
                AND is_current = TRUE
            """)
            
            # Insert new records
            df['is_current'] = True
            df['start_date'] = pd.Timestamp.now().date()
            df['end_date'] = None
            df.to_sql(table_name, conn, if_exists='append', index=False)
    
    def load_fact_table(self, df, table_name):
        """Load data into fact table"""
        # Partition by date for better performance
        df['partition_date'] = df['order_date'].dt.date
        
        # Load in chunks to avoid memory issues
        chunk_size = 10000
        for chunk in pd.read_csv(df, chunksize=chunk_size):
            chunk.to_sql(table_name, self.engine, if_exists='append', index=False)
    
    def create_indexes(self):
        """Create indexes for better query performance"""
        with self.engine.connect() as conn:
            # Fact table indexes
            conn.execute("CREATE INDEX IF NOT EXISTS idx_fact_orders_date ON fact_orders(order_date)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_fact_orders_customer ON fact_orders(customer_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_fact_orders_product ON fact_orders(product_id)")
            
            # Dimension table indexes
            conn.execute("CREATE INDEX IF NOT EXISTS idx_dim_customer_segment ON dim_customer(customer_segment)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_dim_product_category ON dim_product(category)")

# Usage
loader = DataLoader('postgresql://user:pass@warehouse:5432/dwh')
loader.load_dimension_table(customer_dim, 'dim_customer')
loader.load_fact_table(clean_orders, 'fact_orders')
loader.create_indexes()
```

## Dimensional Modeling

### Star Schema Design

```sql
-- Dimension Tables
CREATE TABLE dim_customer (
    customer_key SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    customer_name VARCHAR(255),
    customer_segment VARCHAR(50),
    customer_age_group VARCHAR(50),
    region_name VARCHAR(100),
    is_current BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE
);

CREATE TABLE dim_product (
    product_key SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    is_current BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE
);

CREATE TABLE dim_date (
    date_key INTEGER PRIMARY KEY,
    full_date DATE,
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    month_name VARCHAR(20),
    day_of_month INTEGER,
    day_of_week INTEGER,
    day_name VARCHAR(20),
    is_weekend BOOLEAN,
    is_holiday BOOLEAN
);

-- Fact Table
CREATE TABLE fact_orders (
    order_key SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    customer_key INTEGER REFERENCES dim_customer(customer_key),
    product_key INTEGER REFERENCES dim_product(product_key),
    date_key INTEGER REFERENCES dim_date(date_key),
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    line_total DECIMAL(12,2),
    discount_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2)
);
```

### Snowflake Schema (Normalized Dimensions)

```sql
-- More normalized approach
CREATE TABLE dim_product_category (
    category_key SERIAL PRIMARY KEY,
    category_name VARCHAR(100),
    category_description TEXT
);

CREATE TABLE dim_product_brand (
    brand_key SERIAL PRIMARY KEY,
    brand_name VARCHAR(100),
    brand_country VARCHAR(50)
);

CREATE TABLE dim_product (
    product_key SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255),
    category_key INTEGER REFERENCES dim_product_category(category_key),
    brand_key INTEGER REFERENCES dim_product_brand(brand_key),
    is_current BOOLEAN DEFAULT TRUE
);
```

## Modern Data Architecture Patterns

### Lambda Architecture

```python
# Batch Layer
class BatchProcessor:
    def __init__(self):
        self.spark = SparkSession.builder.appName("BatchProcessor").getOrCreate()
    
    def process_daily_batch(self, date):
        """Process daily batch of data"""
        # Read from data lake
        df = self.spark.read.parquet(f"s3://data-lake/orders/{date}")
        
        # Aggregate metrics
        daily_metrics = df.groupBy("region_id", "product_category") \
                         .agg(
                             sum("revenue").alias("total_revenue"),
                             count("order_id").alias("order_count"),
                             countDistinct("customer_id").alias("unique_customers")
                         )
        
        # Write to batch views
        daily_metrics.write.mode("overwrite") \
                    .parquet(f"s3://batch-views/daily-metrics/{date}")

# Speed Layer
class StreamProcessor:
    def __init__(self):
        self.kafka_consumer = KafkaConsumer('orders', bootstrap_servers=['kafka:9092'])
        self.redis_client = redis.Redis(host='redis', port=6379)
    
    def process_real_time_orders(self):
        """Process real-time order stream"""
        for message in self.kafka_consumer:
            order = json.loads(message.value)
            
            # Update real-time metrics
            key = f"realtime:revenue:{order['region_id']}:{datetime.now().strftime('%Y-%m-%d')}"
            self.redis_client.incrbyfloat(key, order['total'])
            
            # Update real-time counts
            count_key = f"realtime:orders:{order['region_id']}:{datetime.now().strftime('%Y-%m-%d')}"
            self.redis_client.incr(count_key)

# Serving Layer
class ServingLayer:
    def __init__(self):
        self.batch_store = SparkSession.builder.appName("ServingLayer").getOrCreate()
        self.speed_store = redis.Redis(host='redis', port=6379)
    
    def get_revenue_metrics(self, region_id, date):
        """Combine batch and real-time data"""
        # Get batch data (complete, but may be hours old)
        batch_df = self.batch_store.read.parquet(f"s3://batch-views/daily-metrics/{date}")
        batch_revenue = batch_df.filter(f"region_id = {region_id}").select("total_revenue").collect()[0][0]
        
        # Get real-time delta
        realtime_key = f"realtime:revenue:{region_id}:{date}"
        realtime_revenue = float(self.speed_store.get(realtime_key) or 0)
        
        return batch_revenue + realtime_revenue
```

### Kappa Architecture (Stream-First)

```python
from kafka import KafkaConsumer, KafkaProducer
import json

class KappaProcessor:
    def __init__(self):
        self.consumer = KafkaConsumer('raw-events', bootstrap_servers=['kafka:9092'])
        self.producer = KafkaProducer(bootstrap_servers=['kafka:9092'])
    
    def process_events(self):
        """Single stream processing pipeline"""
        for message in self.consumer:
            event = json.loads(message.value)
            
            # Process event
            processed_event = self.transform_event(event)
            
            # Send to multiple output streams
            self.producer.send('processed-events', json.dumps(processed_event))
            self.producer.send('analytics-events', json.dumps(self.create_analytics_event(processed_event)))
            
            # Update materialized views
            self.update_materialized_views(processed_event)
    
    def transform_event(self, event):
        """Transform raw event"""
        return {
            'event_id': event['id'],
            'user_id': event['user_id'],
            'event_type': event['type'],
            'timestamp': event['timestamp'],
            'properties': self.enrich_properties(event['properties'])
        }
    
    def create_analytics_event(self, event):
        """Create analytics-specific event"""
        return {
            'date': event['timestamp'][:10],
            'hour': event['timestamp'][11:13],
            'user_id': event['user_id'],
            'event_type': event['event_type'],
            'revenue': event['properties'].get('revenue', 0)
        }
```

## Data Lake Implementation

### Data Lake Zones

```python
import boto3
from datetime import datetime

class DataLakeManager:
    def __init__(self):
        self.s3 = boto3.client('s3')
        self.bucket = 'company-data-lake'
    
    def store_raw_data(self, data, source, date=None):
        """Store raw data in bronze zone"""
        if not date:
            date = datetime.now().strftime('%Y/%m/%d')
        
        key = f"bronze/{source}/{date}/data.json"
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=json.dumps(data)
        )
    
    def process_to_silver(self, source, date):
        """Process raw data to cleaned format"""
        # Read from bronze
        raw_key = f"bronze/{source}/{date}/data.json"
        response = self.s3.get_object(Bucket=self.bucket, Key=raw_key)
        raw_data = json.loads(response['Body'].read())
        
        # Clean and validate
        cleaned_data = self.clean_data(raw_data)
        
        # Store in silver zone
        silver_key = f"silver/{source}/{date}/cleaned_data.parquet"
        # Convert to Parquet and upload
        self.upload_parquet(cleaned_data, silver_key)
    
    def create_gold_aggregates(self, date):
        """Create business-ready aggregates in gold zone"""
        # Read from silver zone
        silver_data = self.read_silver_data(date)
        
        # Create business aggregates
        daily_metrics = self.calculate_daily_metrics(silver_data)
        customer_metrics = self.calculate_customer_metrics(silver_data)
        
        # Store in gold zone
        self.store_gold_data(daily_metrics, f"gold/daily_metrics/{date}")
        self.store_gold_data(customer_metrics, f"gold/customer_metrics/{date}")
```

## Performance Optimization

### Columnar Storage

```python
import pyarrow as pa
import pyarrow.parquet as pq
import pandas as pd

class ColumnarOptimizer:
    def __init__(self):
        pass
    
    def optimize_for_analytics(self, df):
        """Convert DataFrame to optimized Parquet format"""
        # Define schema with appropriate types
        schema = pa.schema([
            ('order_id', pa.int64()),
            ('customer_id', pa.int64()),
            ('order_date', pa.date32()),
            ('revenue', pa.decimal128(10, 2)),
            ('region', pa.string()),
            ('product_category', pa.string())
        ])
        
        # Convert to Arrow table
        table = pa.Table.from_pandas(df, schema=schema)
        
        # Write with compression and row group optimization
        pq.write_table(
            table,
            'optimized_orders.parquet',
            compression='snappy',
            row_group_size=100000,  # Optimize for query patterns
            use_dictionary=True,    # Compress repeated values
            write_statistics=True   # Enable predicate pushdown
        )
    
    def partition_data(self, df, partition_cols):
        """Partition data for better query performance"""
        table = pa.Table.from_pandas(df)
        
        pq.write_to_dataset(
            table,
            root_path='partitioned_data',
            partition_cols=partition_cols,  # e.g., ['year', 'month']
            compression='snappy'
        )
```

### Query Optimization

```sql
-- Materialized views for common aggregations
CREATE MATERIALIZED VIEW mv_daily_sales AS
SELECT 
    DATE(order_date) as sale_date,
    region_id,
    product_category,
    SUM(line_total) as total_revenue,
    COUNT(DISTINCT order_id) as order_count,
    COUNT(DISTINCT customer_id) as unique_customers
FROM fact_orders f
JOIN dim_product p ON f.product_key = p.product_key
JOIN dim_customer c ON f.customer_key = c.customer_key
GROUP BY DATE(order_date), region_id, product_category;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_daily_sales;

-- Partitioned tables for time-series data
CREATE TABLE fact_orders_partitioned (
    LIKE fact_orders INCLUDING ALL
) PARTITION BY RANGE (order_date);

-- Create monthly partitions
CREATE TABLE fact_orders_2024_01 PARTITION OF fact_orders_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE fact_orders_2024_02 PARTITION OF fact_orders_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

## Modern Analytics Tools

### Integration Examples

```python
# Apache Spark for big data processing
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

spark = SparkSession.builder \
    .appName("DataWarehouseETL") \
    .config("spark.sql.adaptive.enabled", "true") \
    .getOrCreate()

# Read from multiple sources
orders_df = spark.read.jdbc(
    url="jdbc:postgresql://oltp:5432/ecommerce",
    table="orders",
    properties={"user": "user", "password": "pass"}
)

# Complex transformations
result = orders_df \
    .withColumn("order_year", year("order_date")) \
    .withColumn("order_month", month("order_date")) \
    .groupBy("order_year", "order_month", "region_id") \
    .agg(
        sum("total").alias("monthly_revenue"),
        count("order_id").alias("order_count"),
        countDistinct("customer_id").alias("unique_customers")
    ) \
    .orderBy("order_year", "order_month")

# Write to data warehouse
result.write \
    .mode("overwrite") \
    .jdbc(
        url="jdbc:postgresql://warehouse:5432/dwh",
        table="monthly_metrics",
        properties={"user": "user", "password": "pass"}
    )
```

## Best Practices

### Data Quality
- **Implement data validation** at each ETL stage
- **Monitor data freshness** and completeness
- **Handle schema evolution** gracefully
- **Maintain data lineage** for debugging and compliance

### Performance
- **Use appropriate data types** and compression
- **Partition large tables** by commonly filtered columns
- **Create materialized views** for frequent aggregations
- **Implement incremental processing** for large datasets

### Operations
- **Monitor ETL job performance** and failures
- **Implement proper error handling** and retry logic
- **Plan for disaster recovery** and backup strategies
- **Document data definitions** and business rules

## Summary

Data warehousing and analytics require understanding:

- **OLTP vs OLAP** trade-offs and appropriate use cases
- **ETL processes** for data integration and transformation
- **Dimensional modeling** for analytical query performance
- **Modern architectures** like Lambda and Kappa for real-time analytics
- **Data lakes** for flexible, schema-on-read analytics
- **Performance optimization** through columnar storage and partitioning

The key is choosing the right architecture based on your analytical requirements, data volume, and real-time needs while maintaining data quality and operational efficiency.