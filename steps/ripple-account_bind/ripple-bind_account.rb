#!/usr/bin/env ruby
require 'mustache'

#Mustache.template_file = '../../templates/main.c.mustache'

main = Mustache.new
main.template_file = '../../templates/main.c.mustache'
main[:comment] = 'Test templating'

body = Mustache.new
# body.template_extension = 'xml'
body.template_file = '../../templates/accept.c.mustache'
body[:hookname] = 'Alice-Allow'
body[:step] = 'commit-alice'
body[:reason] = 'REF12345'

main[:body] = body.render

puts main.render

