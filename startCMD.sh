#!/bin/bash

CLUSTER="$1"
AWS_REGION="$2"
AWS_KEY_ID="$3"
AWS_SECRET="$4"
KEY="$5"
MASTER_VALUE="$6"
SEC_VALUE="$7"
TASK_FAMILY_NAME="$8"

export AWS_ACCESS_KEY_ID="$AWS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$AWS_SECRET"
aws configure set aws_access_key_id "$AWS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET"
aws configure set default.region "$AWS_REGION"

set -m

npm start &

sleep 10

#-------------------------------------------------------------------------------------------------------------

for i in $(aws ecs list-tasks --family "$TASK_FAMILY_NAME" --region "$AWS_REGION" --cluster "$CLUSTER" --desired-status 'RUNNING' --output text --query 'taskArns[*]'); do
    TASK_DESC=$(aws ecs describe-tasks --region "$AWS_REGION" --tasks "$i" --cluster "$CLUSTER" --include "TAGS" --query "tasks[].tags[?key=='name'].[value]" --output text)
    echo "$TASK_DESC"
    if [ "$TASK_DESC" = "$SEC_VALUE" ]; then
        task=$i
        break
    fi
done

if [ "$TASK_DESC" != "$SEC_VALUE" ]; then
    echo "Secondary task not found"
    exit 1
fi

ip="localhost"
echo "$ip"
res=$(curl "$ip"/alive)

if [ "$res" != "alive" ]; then
    NO_RES=$(aws ecs stop-task --region "$AWS_REGION" --task "$task" --cluster "$CLUSTER" --reason "APP did not aswer (alive) status, response:$res")
    echo "APP did not aswer (alive) status"
    echo "Res from APP:"
    echo "$res"
    exit 1
fi

echo "$res"

#Fechando task MASTER se houver
for i in $(aws ecs list-tasks --family "$TASK_FAMILY_NAME" --cluster "$CLUSTER" --desired-status 'RUNNING' --output text --query 'taskArns[*]'); do
    TASK_DESC=$(aws ecs describe-tasks --tasks "$i" --cluster "$CLUSTER" --include "TAGS" --query "tasks[].tags[?key=='$KEY'].[value]" --output text)
    if [ "$TASK_DESC" = "$MASTER_VALUE" ]; then
        NO_RES=$(aws ecs stop-task --task "$i" --cluster "$CLUSTER" --reason "Fechado pelo auto deploy")
        break
    fi
done

#Trocando o nome da secundaria para master
#Neste caso seria trocado o IP também
#mas precisa de um IP estático

#Procurando task secundaria
for i in $(aws ecs list-tasks --family "$TASK_FAMILY_NAME" --cluster "$CLUSTER" --desired-status 'RUNNING' --output text --query 'taskArns[*]'); do
    TASK_DESC=$(aws ecs describe-tasks --tasks "$i" --cluster "$CLUSTER" --include "TAGS" --query "tasks[].tags[?key=='$KEY'].[value]" --output text)
    if [ "$TASK_DESC" = "$SEC_VALUE" ]; then
        task=$i
        break
    fi
done

if [ "$TASK_DESC" != "$SEC_VALUE" ]; then
    echo "Secondary task not found"
    exit 1
fi

#alterando a secundaria para primaria
NO_RES=$(aws ecs tag-resource --resource-arn "$task" --tags key="$KEY",value="$MASTER_VALUE")

#aguardar atualizar no aws
sleep 3

#verificando se a alteração deu certo

#Procurando task primaria
for i in $(aws ecs list-tasks --family "$TASK_FAMILY_NAME" --cluster "$CLUSTER" --desired-status 'RUNNING' --output text --query 'taskArns[*]'); do
    TASK_DESC=$(aws ecs describe-tasks --tasks "$i" --cluster "$CLUSTER" --include "TAGS" --query "tasks[].tags[?key=='$KEY'].[value]" --output text)
    if [ "$TASK_DESC" = "$MASTER_VALUE" ]; then
        task=$i
        break
    fi
done

if [ "$TASK_DESC" != "$MASTER_VALUE" ]; then
    echo "The secondary task did not change herself to primary task"
    exit 1
fi

eni=$(aws ecs describe-tasks --include "TAGS" --tasks "$task" --cluster "$CLUSTER" --query "tasks[].attachments[].details[?name=='networkInterfaceId'].[value]" --output text)
ip=$(aws ec2 describe-network-interfaces --network-interface-ids "$eni" --query "NetworkInterfaces[].Association[].[PublicDnsName]" --output text)

sleep 3

#Procurando task primaria
for i in $(aws ecs list-tasks --family "$TASK_FAMILY_NAME" --cluster "$CLUSTER" --desired-status 'RUNNING' --output text --query 'taskArns[*]'); do
    TASK_DESC=$(aws ecs describe-tasks --tasks "$i" --cluster "$CLUSTER" --include "TAGS" --query "tasks[].tags[?key=='$KEY'].[value]" --output text)
    if [ "$TASK_DESC" = "$MASTER_VALUE" ]; then
        task_arn=$(aws ecs describe-tasks --tasks "$i" --cluster "$CLUSTER" --query "tasks[].taskDefinitionArn" --output text)
        break
    fi
done

for i in $(aws ecs list-task-definitions --output text --query "taskDefinitionArns[*]"); do
    if [ "$i" = "$task_arn" ]; then
        break
    else
        NO_RES=$(aws ecs deregister-task-definition --task-definition "$i")
    fi
done

#O github se encarrega de deletar as tasks que ficam inativas

#--------------------------------------------------------------------------------------------------------
fg %1

#npm start
