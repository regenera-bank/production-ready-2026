terraform { required_version = ">= 1.9.0" }

variable "project_id" { type = string }
variable "region" { type = string }

locals { environment = "homologation" }

# módulos reais são promovidos por digest e policy as code. credencial não entra aqui.
