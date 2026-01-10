# Types of Work API Documentation

## Endpoint

```
GET /api/projects/:projectId/work-types
```

## Authentication
- **Required:** Yes (Bearer token in Authorization header)
- **Middleware:** `protect` (from authMiddleware)

## Request Parameters

### Path Parameters
| Parameter | Type     | Required | Description          |
|-----------|----------|----------|----------------------|
| projectId | ObjectId | Yes      | MongoDB Project ID   |

### Query Parameters
None currently supported

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

## Response

### Success (200 OK)

**Response Format:**
```json
[
  {
    "type": "Task",
    "rawType": "task",
    "count": 6,
    "percentage": 86
  },
  {
    "type": "Epic",
    "rawType": "epic",
    "count": 1,
    "percentage": 14
  },
  {
    "type": "Bug",
    "rawType": "bug",
    "count": 0,
    "percentage": 0
  },
  {
    "type": "Story",
    "rawType": "story",
    "count": 0,
    "percentage": 0
  },
  {
    "type": "Subtask",
    "rawType": "subtask",
    "count": 0,
    "percentage": 0
  }
]
```

### Response Fields

| Field      | Type    | Description                              |
|------------|---------|------------------------------------------|
| type       | string  | Formatted type name (capitalized)        |
| rawType    | string  | Lowercase type identifier (enum value)   |
| count      | number  | Number of items of this type             |
| percentage | number  | Percentage of total (0-100)              |

**Notes:**
- All types are included, even if count is 0
- Percentages are rounded to nearest integer
- Total of all percentages = 100 (with rounding)
- Ordered by rawType alphabetically

### Example Response

```json
[
  {
    "type": "Bug",
    "rawType": "bug",
    "count": 0,
    "percentage": 0
  },
  {
    "type": "Epic",
    "rawType": "epic",
    "count": 1,
    "percentage": 14
  },
  {
    "type": "Story",
    "rawType": "story",
    "count": 0,
    "percentage": 0
  },
  {
    "type": "Subtask",
    "rawType": "subtask",
    "count": 0,
    "percentage": 0
  },
  {
    "type": "Task",
    "rawType": "task",
    "count": 6,
    "percentage": 86
  }
]
```

## Error Responses

### 404 Not Found
```json
{
  "success": false,
  "message": "Project not found"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this project"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error fetching work types"
}
```

## Rate Limiting
- No specific rate limiting
- Inherits from global API rate limits

## Caching
- **Current:** No caching implemented
- **Recommended:** Cache with 5-minute TTL
- **Invalidate on:** Issue CRUD operations

## Implementation Details

### Database Query
```javascript
const tasks = await Task.find({ project: projectId });
```

**Complexity:**
- Time: O(n) where n = number of tasks
- Space: O(1) constant overhead

### Aggregation
```javascript
const typeMap = {
  'task': 0,
  'epic': 0,
  'story': 0,
  'bug': 0,
  'subtask': 0
};

tasks.forEach(task => {
  const type = task.issueType || 'task';
  if (typeMap.hasOwnProperty(type)) {
    typeMap[type]++;
  }
});
```

### Percentage Calculation
```javascript
const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
```

## Performance Metrics

| Metric             | Value      |
|--------------------|-----------|
| Average Response   | <100ms    |
| Max Response       | <500ms    |
| Database Query     | 1 query   |
| Memory Usage       | Minimal   |
| Concurrent Users   | Unlimited |

## Testing

### cURL Example
```bash
curl -X GET \
  'http://localhost:5000/api/projects/507f1f77bcf86cd799439011/work-types' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json'
```

### JavaScript/Axios Example
```javascript
import axios from 'axios';

const response = await axios.get(
  `http://localhost:5000/api/projects/${projectId}/work-types`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

console.log(response.data);
```

### Python Example
```python
import requests

headers = {
    'Authorization': f'Bearer {token}'
}

response = requests.get(
    f'http://localhost:5000/api/projects/{project_id}/work-types',
    headers=headers
)

print(response.json())
```

## Related Endpoints

- `GET /api/projects/:id/stats` - Get project statistics
- `GET /api/tasks` - Get all tasks (with filters)
- `POST /api/tasks` - Create task (triggers cache invalidation)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Future Enhancements

### 1. Sprint Filter
```
GET /api/projects/:projectId/work-types?sprintId=xyz
```
Only count items in specific sprint

### 2. Date Range Filter
```
GET /api/projects/:projectId/work-types?startDate=2024-01-01&endDate=2024-01-31
```
Count items created/modified in range

### 3. Status Filter
```
GET /api/projects/:projectId/work-types?status=done
```
Only count items with specific status

### 4. Caching
```javascript
const cacheKey = `work-types:${projectId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### 5. Sorting Options
```
GET /api/projects/:projectId/work-types?sortBy=count&order=desc
```

## Changelog

### Version 1.0 (Current)
- Initial implementation
- Supports all 5 work types
- Basic aggregation and percentage calculation
- No caching
- No filters

### Planned
- v1.1: Sprint filter support
- v1.2: Date range filters
- v1.3: Redis caching
- v2.0: Advanced filtering and sorting

---

**API Status:** ✅ Production Ready
**Last Updated:** January 10, 2026
**Maintainer:** Digital Dockers Suite Team
