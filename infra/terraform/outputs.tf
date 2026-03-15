output "cloud_run_service" {
  description = "Cloud Run service name"
  value       = google_cloud_run_v2_service.app.name
}

output "cloud_run_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_v2_service.app.uri
}

output "artifact_repository" {
  description = "Artifact Registry repository ID"
  value       = google_artifact_registry_repository.app_images.repository_id
}

output "bucket_name" {
  description = "GCS bucket used by the app"
  value       = var.bucket_name
}

output "runtime_service_account_email" {
  description = "Runtime service account email"
  value       = google_service_account.runtime.email
}
