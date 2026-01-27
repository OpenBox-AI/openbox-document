---
title: krnl-cluster
description: Quick install commands for common components in this cluster.
sidebar_position: 1
---

Quick install commands for common components in this cluster.

## Prerequisites
- `kubectl` configured to target the cluster
- `helm` installed

## Nodepool
```powershell
kubectl apply -f ./nodepool/nodepool.yaml
```

## Istio
```powershell
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update
kubectl create namespace istio-system
helm install istio-base istio/base -n istio-system --set defaultRevision=default
sleep 10
helm install istiod istio/istiod -n istio-system --wait
sleep 10
kubectl create namespace istio-ingress
helm install istio-ingress istio/gateway --values ./LB/istio_value.yaml -n istio-ingress --wait
sleep 10
kubectl apply -f ./LB/gateway.yaml -n istio-ingress
```

## Argo Rollouts
```powershell
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```

## Argo CD
```powershell
helm repo add argo https://argoproj.github.io/argo-helm
helm search repo argo
sleep 10
kubectl create namespace argocd
```

## All app bellow mana
All apps below are managed by Argo CD.

## Deploy guide (Argo CD)
- Update chart values in `<app>/values.yaml` (image tag, config/secret refs, resources, service/ingress, namespace, nodeSelector, tolerations).
- Ensure `argo-application/<app>.yaml` points to the correct repo, path, valueFiles, and destination namespace.
- Commit changes and sync the app in Argo CD (UI or `argocd app sync <app>`).

### Example: openbox-backend
- Update `openbox-backend/values.yaml`: `image.tag` (and `image.repository` if needed), `virtualservice.host.*`, `resources`, `nodeSelector`, `tolerations`, and `serviceAccount.RolePodArn`.
- Verify `argo-application/openbox-backend.yaml`: `path: openbox-backend`, `helm.valueFiles: [values.yaml]`, `destination.namespace: openbox`.

## Openbox backend
```powershell
helm upgrade --install --values .\openbox-backend\values.yaml openbox-backend .\openbox-backend\ --namespace openbox
```

## Openbox core
```powershell
helm upgrade --install --values .\openbox-core\values.yaml openbox-core .\openbox-core\ --namespace openbox
```

## Openbox guardrails
```powershell
helm upgrade --install --values .\openbox-guardrails\values.yaml openbox-guardrails .\openbox-guardrails\ --namespace openbox
```

## OPA app
```powershell
helm upgrade --install --values .\opa-app\values.yaml opa-app .\opa-app\ --namespace opa
```

## Temporal
```powershell
helm upgrade --install --values .\temporal\values.yaml temporal .\temporal\ --namespace temporal
```
