# Generated by Django 5.2 on 2025-05-03 07:30

import accounts.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='categorias',
            options={'verbose_name': 'Categoria', 'verbose_name_plural': 'Categorias'},
        ),
        migrations.AlterField(
            model_name='destinos',
            name='fecha_salida',
            field=models.DateTimeField(validators=[accounts.models.validate_fecha_futura]),
        ),
        migrations.AlterModelTable(
            name='categorias',
            table='categorias',
        ),
    ]
