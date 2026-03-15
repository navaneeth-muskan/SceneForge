variable "project_id" {
  description = "Google Cloud project ID"
  type        = string

  validation {
    condition     = !can(regex("^[0-9]+$", var.project_id))
    error_message = "project_id must be the project ID string (for example my-project-123), not the numeric project number."
  }
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "videoai-backend"
}

variable "container_image" {
  description = "Full container image URI, for example us-central1-docker.pkg.dev/PROJECT/REPO/videoai:latest"
  type        = string
}

variable "artifact_repository_id" {
  description = "Artifact Registry Docker repository ID"
  type        = string
  default     = "videoai-images"
}

variable "runtime_service_account_id" {
  description = "Service account ID used by Cloud Run runtime"
  type        = string
  default     = "videoai-runtime"
}

variable "service_account_file" {
  description = "Path inside container to service account JSON file"
  type        = string
  default     = "digital-scanning-service_account.json"
}

variable "bucket_name" {
  description = "Optional GCS bucket name for assets. If null, uses PROJECT_ID-videoai-assets"
  type        = string
  default     = null
  nullable    = true
}

variable "google_genai_api_key" {
  description = "Gemini API key. Leave empty to set outside Terraform."
  type        = string
  default     = ""
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Gemini API key alias (optional if GOOGLE_GENAI_API_KEY is set)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "render_server_url" {
  description = "Render server URL"
  type        = string
  default     = ""
}

variable "remotion_mapbox_token" {
  description = "Mapbox token for map scenes"
  type        = string
  default     = ""
  sensitive   = true
}

variable "service_account_json" {
  description = "Optional service account JSON content used by app code that expects SERVICE_ACCOUNT_JSON."
  type        = string
  default     = ""
  sensitive   = true
}

variable "extra_env_vars" {
  description = "Extra env vars to inject into Cloud Run container"
  type        = map(string)
  default     = {}
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated invocation of Cloud Run service"
  type        = bool
  default     = true
}

variable "min_instances" {
  description = "Minimum Cloud Run instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum Cloud Run instances"
  type        = number
  default     = 3
}

variable "cpu" {
  description = "CPU limit for Cloud Run container"
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Memory limit for Cloud Run container"
  type        = string
  default     = "1Gi"
}
