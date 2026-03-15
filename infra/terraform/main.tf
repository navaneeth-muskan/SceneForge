terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.30.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  bucket_name_effective = coalesce(var.bucket_name, "${var.project_id}-videoai-assets")

  base_env_vars = {
    NODE_ENV             = "production"
    SERVICE_ACCOUNT_FILE = var.service_account_file
    GCP_PROJECT_ID       = var.project_id
    BUCKET_NAME          = local.bucket_name_effective
  }

  optional_env_vars = var.google_genai_api_key != "" ? {
    GOOGLE_GENAI_API_KEY = var.google_genai_api_key
  } : {}

  optional_env_vars_openai = var.openai_api_key != "" ? {
    OPENAI_API_KEY = var.openai_api_key
  } : {}

  optional_env_vars_gemini = var.gemini_api_key != "" ? {
    GEMINI_API_KEY = var.gemini_api_key
  } : {}

  optional_env_vars_render_server = var.render_server_url != "" ? {
    RENDER_SERVER_URL = var.render_server_url
  } : {}

  optional_env_vars_mapbox = var.remotion_mapbox_token != "" ? {
    REMOTION_MAPBOX_TOKEN = var.remotion_mapbox_token
  } : {}

  service_account_env = var.service_account_json != "" ? {
    SERVICE_ACCOUNT_JSON = var.service_account_json
  } : {}

  env_vars = merge(
    local.base_env_vars,
    local.optional_env_vars,
    local.optional_env_vars_openai,
    local.optional_env_vars_gemini,
    local.optional_env_vars_render_server,
    local.optional_env_vars_mapbox,
    local.service_account_env,
    var.extra_env_vars,
  )

  required_apis = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "storage.googleapis.com",
    "aiplatform.googleapis.com",
    "iam.googleapis.com",
  ])

  runtime_roles = toset([
    "roles/storage.objectAdmin",
    "roles/aiplatform.user",
    "roles/logging.logWriter",
  ])
}

resource "google_project_service" "required" {
  for_each = local.required_apis
  project  = var.project_id
  service  = each.key

  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "app_images" {
  location      = var.region
  repository_id = var.artifact_repository_id
  description   = "Docker images for VideoAI services"
  format        = "DOCKER"

  depends_on = [google_project_service.required]
}

resource "google_service_account" "runtime" {
  account_id   = var.runtime_service_account_id
  display_name = "VideoAI Cloud Run runtime service account"
}

resource "google_project_iam_member" "runtime_roles" {
  for_each = local.runtime_roles
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${google_service_account.runtime.email}"
}

# Bucket already exists — managed outside Terraform.
# Use: data "google_storage_bucket" "assets" { name = local.bucket_name_effective }
# if you need to reference it in outputs.

resource "google_cloud_run_v2_service" "app" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.runtime.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.container_image

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      dynamic "env" {
        for_each = local.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  depends_on = [
    google_project_service.required,
    google_project_iam_member.runtime_roles,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  count    = var.allow_unauthenticated ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
