package regenera.terraform

deny[msg] { input.resource.type == "database"; input.resource.public == true; msg := "database público é proibido" }
