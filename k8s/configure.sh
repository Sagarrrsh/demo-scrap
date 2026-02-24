#!/bin/bash


echo "Creating namespaces..."
kubectl create namespace argo-rollouts --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

echo "Installing Argo Rollouts..."
kubectl apply -n argo-rollouts \
-f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

echo "Installing Argo CD (UI)..."
kubectl apply -n argocd \
-f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Reducing Argo CD memory usage (lighter Redis)..."
kubectl -n argocd patch deployment argocd-redis \
--type='json' \
-p='[{"op":"replace","path":"/spec/template/spec/containers/0/image","value":"redis:7-alpine"}]' || true

echo "Exposing Argo CD UI via NodePort..."
kubectl patch svc argocd-server -n argocd -p '{"spec":{"type":"NodePort"}}'

echo "Installing lightweight storage..."
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml

echo "Setting default storage class..."
kubectl patch storageclass local-path \
-p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}' || true

echo "Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/cloud/deploy.yaml

echo "Exposing Ingress via NodePort..."
kubectl patch svc ingress-nginx-controller -n ingress-nginx \
-p '{"spec":{"type":"NodePort"}}'

echo "Waiting for components to start..."
sleep 30

echo "Argo CD admin password:"
kubectl -n argocd get secret argocd-initial-admin-secret \
-o jsonpath="{.data.password}" | base64 -d && echo

echo "Done. Check pods with: kubectl get pods -A"
