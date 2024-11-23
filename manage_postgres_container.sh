#!/bin/bash

CONTAINER_NAME="roboct0-postgres"

function delete_container() {
  docker rm -f $CONTAINER_NAME
}

function create_container() {
  docker run --name $CONTAINER_NAME \
    --env-file ./packages/api/.env \
    -p 5432:5432 \
    -d postgres:latest
}

function restart_container() {
  docker restart $CONTAINER_NAME
}

function container_exists() {
  docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}$"
}

function show_help() {
  echo "Usage: $0 {delete|create|restart|help}"
  echo
  echo "Commands:"
  echo "  delete   Delete the container if it exists"
  echo "  create   Create a new container, optionally deleting the existing one"
  echo "  restart  Restart the container if it exists"
  echo "  help     Show this help message"
}

case $1 in
  delete)
    if container_exists; then
      read -p "Container $CONTAINER_NAME exists. Do you want to delete it? (y/n): " choice
      if [ "$choice" == "y" ]; then
        delete_container
        echo "Container $CONTAINER_NAME deleted."
      else
        echo "Container $CONTAINER_NAME not deleted."
      fi
    else
      echo "Container $CONTAINER_NAME does not exist."
    fi
    ;;
  create)
    if container_exists; then
      read -p "Container $CONTAINER_NAME exists. Do you want to delete it and create a new one? (y/n): " choice
      if [ "$choice" == "y" ]; then
        delete_container
        create_container
        echo "Container $CONTAINER_NAME created."
      else
        echo "Container $CONTAINER_NAME not created."
      fi
    else
      create_container
      echo "Container $CONTAINER_NAME created."
    fi
    ;;
  restart)
    if container_exists; then
      restart_container
      echo "Container $CONTAINER_NAME restarted."
    else
      echo "Container $CONTAINER_NAME does not exist."
    fi
    ;;
  help)
    show_help
    ;;
  *)
    echo "Invalid command."
    show_help
    ;;
esac
