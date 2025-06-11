# Database Setup

This directory contains all database-related scripts for the Neuro-Snap project.

## Directory Structure

```
database/
├── migrations/     # Database schema migrations
├── seeds/         # Seed data for initial setup
└── init.sql       # Main initialization script
```

## Tables

1. `test_models`: Stores information about different personality test models
2. `user_survey`: Tracks user survey submissions and their status
3. `user_raw_answers`: Stores individual answers for each survey
4. `knowledge_base`: Contains AI analysis knowledge base entries
5. `analysis_results`: Stores AI analysis results for each survey

## Setup Instructions

1. Connect to your Supabase database using the Supabase dashboard or CLI
2. Run the initialization script:
   ```sql
   \i database/init.sql
   ```

## Adding New Migrations

1. Create a new migration file in the `migrations` directory with a sequential number
2. Add your SQL changes to the file
3. Update the `init.sql` file to include your new migration

## Adding New Seed Data

1. Create a new seed file in the `seeds` directory with a sequential number
2. Add your seed data SQL to the file
3. Update the `init.sql` file to include your new seed file

## Database Schema

### test_models
- `id`: UUID (Primary Key)
- `name`: VARCHAR(100)
- `description`: TEXT
- `question_count`: INTEGER
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### user_survey
- `id`: UUID (Primary Key)
- `user_id`: VARCHAR(100)
- `model_type`: VARCHAR(50)
- `status`: VARCHAR(20)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### user_raw_answers
- `id`: UUID (Primary Key)
- `survey_id`: UUID (Foreign Key)
- `question_id`: VARCHAR(100)
- `model_type`: VARCHAR(50)
- `option_id`: VARCHAR(100)
- `option_value`: INTEGER
- `text_value`: TEXT
- `created_at`: TIMESTAMP

### knowledge_base
- `id`: UUID (Primary Key)
- `model_type`: VARCHAR(50)
- `content`: TEXT
- `tags`: TEXT[]
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### analysis_results
- `id`: UUID (Primary Key)
- `survey_id`: UUID (Foreign Key)
- `model_type`: VARCHAR(50)
- `analysis`: TEXT
- `summary`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP 